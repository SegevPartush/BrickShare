import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface SearchResult {
  postId: string;
  relevanceScore: number;
  reason: string;
}

const SYSTEM_PROMPT = `You are a LEGO expert assistant for BrickShare, a social network for LEGO collectors.
You have access to real-time Google Search to find current prices, availability and market trends.

Your capabilities:
- Search the web for current LEGO prices on BrickLink, eBay, Amazon, Walmart etc.
- Compare prices across different platforms
- Find rare/retired sets and their market value
- Answer questions about users selling sets within our app (when app data is provided)

Rules:
- Always respond in Hebrew if the question is in Hebrew
- When giving prices, search for real current data and cite the source platform
- Be specific: give actual price ranges, not vague estimates
- If app data shows a user selling a set, mention their username and compare to market price
- Format answers clearly with bullet points when listing multiple items`;

export class AIService {
  // מודל עם Google Search לשאלות מחיר ומידע חיצוני
  private modelWithSearch = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    tools: [{ googleSearch: {} } as any],
  });

  // מודל רגיל לשאלות פנימיות (ללא חיפוש)
  private model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  private requestCount = 0;
  private lastResetTime = Date.now();
  private readonly MAX_REQUESTS_PER_MINUTE = 10;

  private checkRateLimit(): void {
    const now = Date.now();
    if (now - this.lastResetTime > 60000) {
      this.requestCount = 0;
      this.lastResetTime = now;
    }
    if (this.requestCount >= this.MAX_REQUESTS_PER_MINUTE) {
      throw new Error('Rate limit exceeded. Please try again in a minute.');
    }
    this.requestCount++;
  }

  // מזהה אם השאלה דורשת חיפוש מחיר או מידע חיצוני
  private needsWebSearch(message: string): boolean {
    const priceKeywords = ['מחיר', 'שווה', 'עולה', 'קונים', 'מוכרים', 'השוואה', 'bricklink', 'ebay', 'amazon', 'price', 'worth', 'cost', 'market', 'compare'];
    const lower = message.toLowerCase();
    return priceKeywords.some(kw => lower.includes(kw));
  }

  async smartSearch(query: string, posts: { _id: unknown; text: string }[]): Promise<SearchResult[]> {
    this.checkRateLimit();
    const postsText = posts.map((post, i) => `Post ${i}: "${post.text}" (ID: ${post._id})`).join('\n');
    const prompt = `Analyze these LEGO posts and find relevant ones for: "${query}"\n\nPosts:\n${postsText}\n\nReturn JSON array:\n[{ "postId": "id_here", "relevanceScore": 0.9, "reason": "explanation" }]\n\nOnly include scores above 0.5.`;
    try {
      const result = await this.model.generateContent(prompt);
      const text = result.response.text();
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) return [];
      return (JSON.parse(jsonMatch[0]) as SearchResult[]).sort((a, b) => b.relevanceScore - a.relevanceScore);
    } catch {
      return [];
    }
  }

  async generateSuggestions(userPosts: string[]): Promise<string[]> {
    this.checkRateLimit();
    const interests = userPosts.join(', ') || 'LEGO building';
    const prompt = `Based on these interests: ${interests}\n\nSuggest 5 LEGO post ideas.\nReturn JSON array: ["idea1", "idea2", ...]`;
    try {
      const result = await this.model.generateContent(prompt);
      const text = result.response.text();
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) return [];
      return JSON.parse(jsonMatch[0]) as string[];
    } catch {
      return [];
    }
  }

  async askAssistant(userMessage: string, appContext?: string): Promise<string> {
    this.checkRateLimit();

    const contextSection = appContext
      ? `\n\nנתונים מהאפליקציה שלנו (BrickShare):\n${appContext}\n\nהשתמש בנתונים אלו ובחיפוש רשת לתת תשובה מקיפה.`
      : '';

    const prompt = `${SYSTEM_PROMPT}${contextSection}\n\nUser: ${userMessage}\n\nAssistant:`;

    // אם השאלה על מחירים - משתמשים במודל עם Google Search
    const activeModel = this.needsWebSearch(userMessage) ? this.modelWithSearch : this.model;

    try {
      const result = await activeModel.generateContent(prompt);
      return result.response.text().trim();
    } catch (error) {
      console.error('askAssistant failed:', error);
      // fallback למודל רגיל אם Search נכשל
      try {
        const fallback = await this.model.generateContent(prompt);
        return fallback.response.text().trim();
      } catch {
        throw new Error('שגיאה בתקשורת עם מערכת ה-AI. אנא נסה שוב.');
      }
    }
  }

  async estimateSetPrice(setName: string, condition: 'new' | 'used' | 'sealed'): Promise<string> {
    this.checkRateLimit();
    const conditionMap: Record<string, string> = { new: 'חדש', used: 'משומש', sealed: 'אטום במארז מקורי' };
    const prompt = `${SYSTEM_PROMPT}\n\nUser: חפש ומצא את המחיר הנוכחי של "${setName}" במצב ${conditionMap[condition]} ב-BrickLink, eBay ו-Amazon. הצג השוואת מחירים ומגמת שוק.\n\nAssistant:`;
    try {
      const result = await this.modelWithSearch.generateContent(prompt);
      return result.response.text().trim();
    } catch (error) {
      console.error('estimateSetPrice failed:', error);
      throw new Error('שגיאה בהערכת המחיר. אנא נסה שוב.');
    }
  }

  async findSets(criteria: string): Promise<string> {
    this.checkRateLimit();
    const prompt = `${SYSTEM_PROMPT}\n\nUser: חפש וצא 3-5 סטי LEGO לפי: ${criteria}. כלול מספר סט, תיאור, מחיר נוכחי ממקורות אמיתיים.\n\nAssistant:`;
    try {
      const result = await this.modelWithSearch.generateContent(prompt);
      return result.response.text().trim();
    } catch (error) {
      console.error('findSets failed:', error);
      throw new Error('שגיאה בחיפוש הסטים. אנא נסה שוב.');
    }
  }
}

export const aiService = new AIService();
