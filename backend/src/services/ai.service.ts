import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface SearchResult {
  postId: string;
  relevanceScore: number;
  reason: string;
}

// הפרומפט הזה מגדיר לGemini את ההקשר של הצ'אטבוט שלנו
const SYSTEM_PROMPT = `You are a LEGO expert assistant for BrickShare, a social network for LEGO collectors.
Help users find LEGO sets, estimate market prices, and get recommendations.
Respond in Hebrew if the question is in Hebrew, otherwise in English.
Be friendly and concise. When estimating prices, note these are approximate market values.`;

export class AIService {
  private model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  private requestCount = 0;
  private lastResetTime = Date.now();
  private readonly MAX_REQUESTS_PER_MINUTE = 10;

  // מגביל כמות בקשות כדי לא לחרוג ממכסת ה-API
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

  async smartSearch(query: string, posts: { _id: unknown; text: string }[]): Promise<SearchResult[]> {
    this.checkRateLimit();

    const postsText = posts
      .map((post, index) => `Post ${index}: "${post.text}" (ID: ${post._id})`)
      .join('\n');

    const prompt = `
Analyze these LEGO posts and find relevant ones for: "${query}"

Posts:
${postsText}

Return JSON array:
[{ "postId": "id_here", "relevanceScore": 0.9, "reason": "explanation" }]

Only include scores above 0.5.`;

    try {
      const result = await this.model.generateContent(prompt);
      const text = result.response.text();
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) return [];
      const results = JSON.parse(jsonMatch[0]) as SearchResult[];
      return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
    } catch (error) {
      console.error('smartSearch failed:', error);
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
    } catch (error) {
      console.error('generateSuggestions failed:', error);
      return [];
    }
  }

  async askAssistant(userMessage: string): Promise<string> {
    this.checkRateLimit();
    const prompt = `${SYSTEM_PROMPT}\n\nUser: ${userMessage}\n\nAssistant:`;
    try {
      const result = await this.model.generateContent(prompt);
      return result.response.text().trim();
    } catch (error) {
      console.error('askAssistant failed:', error);
      throw new Error('שגיאה בתקשורת עם מערכת ה-AI. אנא נסה שוב.');
    }
  }

  async estimateSetPrice(setName: string, condition: 'new' | 'used' | 'sealed'): Promise<string> {
    this.checkRateLimit();
    const conditionMap: Record<string, string> = { new: 'חדש', used: 'משומש', sealed: 'אטום במארז מקורי' };
    const prompt = `${SYSTEM_PROMPT}\n\nUser: הערך את המחיר של "${setName}" במצב ${conditionMap[condition]}. כלול טווח מחירים בדולרים ומגמת שוק.\n\nAssistant:`;
    try {
      const result = await this.model.generateContent(prompt);
      return result.response.text().trim();
    } catch (error) {
      console.error('estimateSetPrice failed:', error);
      throw new Error('שגיאה בהערכת המחיר. אנא נסה שוב.');
    }
  }

  async findSets(criteria: string): Promise<string> {
    this.checkRateLimit();
    const prompt = `${SYSTEM_PROMPT}\n\nUser: המלץ לי על 3-5 סטים לפי: ${criteria}. כלול מספר סט, תיאור קצר וטווח מחיר.\n\nAssistant:`;
    try {
      const result = await this.model.generateContent(prompt);
      return result.response.text().trim();
    } catch (error) {
      console.error('findSets failed:', error);
      throw new Error('שגיאה בחיפוש הסטים. אנא נסה שוב.');
    }
  }
}

export const aiService = new AIService();
