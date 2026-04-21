import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface SearchResult {
  postId: string;
  relevanceScore: number;
  reason: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// הנחיות מערכת קצרות וברורות — מגדירות איך הבוט מתנהג בכל השיחות
const SYSTEM_PROMPT = `You are a LEGO assistant for the BrickShare social network.
- Answer in the same language as the user (Hebrew or English).
- Be specific: mention set numbers, names and prices when asked.
- For marketplace questions (price/sell/buy), list sellers from the app and compare to market prices.
- Keep answers organized (short sections or bullets), not one-line replies.`;

// פרמטרים של מודל השיחה - temperature נמוך לתשובות עקביות
const CHAT_CONFIG = {
  temperature: 0.5,
  topP: 0.9,
  maxOutputTokens: 2000,
};

// שומרים רק 12 הודעות אחרונות בהיסטוריה כדי לחסוך טוקנים
const MAX_HISTORY = 12;

// מילות מפתח שמצביעות על שאלת מחיר/שוק - נשתמש כדי להחליט אם צריך חיפוש באינטרנט
const MARKET_KEYWORDS = [
  'מחיר', 'שווה', 'עולה', 'מוכר', 'מוכרים', 'מי מוכר', 'למכירה', 'השוואה', 'כמה עולה',
  'bricklink', 'ebay', 'amazon', 'price', 'worth', 'cost', 'market', 'compare', 'buy', 'sell', 'deal'
];

export class AIService {
  // מודל עם גישה ל-Google Search - לשאלות על מחירים ונתונים חיצוניים
  private modelWithSearch = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    tools: [{ googleSearch: {} } as any],
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: CHAT_CONFIG,
  });

  // מודל רגיל ללא חיפוש - לשאלות כלליות
  private model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: CHAT_CONFIG,
  });

  private requestCount = 0;
  private lastResetTime = Date.now();
  private readonly MAX_REQUESTS_PER_MINUTE = 10;

  // מונע חריגה ממכסת ה-API של Gemini
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

  // בודק אם השאלה קשורה למחירים/מכירות
  private isMarketQuery(message: string): boolean {
    const lower = message.toLowerCase();
    return MARKET_KEYWORDS.some((kw) => lower.includes(kw));
  }

  // ממיר את פורמט ההיסטוריה של הפרונט לפורמט של Gemini
  private toGeminiHistory(history: ChatMessage[]) {
    return history.map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));
  }

  // חותך את ההיסטוריה ומוודא שההודעה הראשונה היא של המשתמש (דרישה של Gemini)
  private prepareHistory(history: ChatMessage[]): ChatMessage[] {
    const trimmed = history.length > MAX_HISTORY ? history.slice(-MAX_HISTORY) : history;
    let i = 0;
    while (i < trimmed.length && trimmed[i].role === 'assistant') i++;
    return trimmed.slice(i);
  }

  // מחזיר 5 רעיונות לפוסטים על סמך הפוסטים של המשתמש (משמש ב-GET /api/posts/suggestions)
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

  // חיפוש חכם של פוסטים רלוונטיים בעזרת ה-AI (משמש ב-GET /api/posts/search)
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

  // צ'אט השיחה הראשי - משלב היסטוריה + הקשר מהאפליקציה
  async askAssistant(userMessage: string, appContext?: string, history: ChatMessage[] = []): Promise<string> {
    this.checkRateLimit();

    // משתמשים במודל עם חיפוש רק כשמדובר בשאלת שוק/מחיר כדי לא לבזבז קריאות
    const activeModel = this.isMarketQuery(userMessage) ? this.modelWithSearch : this.model;
    const geminiHistory = this.toGeminiHistory(this.prepareHistory(history));

    // מצרפים את ההקשר מהאפליקציה להודעה הנוכחית כדי שה-AI יראה את פוסטים הרלוונטיים
    const fullMessage = appContext
      ? `${userMessage}\n\n[נתונים מ-BrickShare]\n${appContext}`
      : userMessage;

    try {
      const chat = activeModel.startChat({ history: geminiHistory });
      const result = await chat.sendMessage(fullMessage);
      return result.response.text().trim();
    } catch (error) {
      console.error('askAssistant failed:', error);
      throw new Error('שגיאה בתקשורת עם מערכת ה-AI. אנא נסה שוב.');
    }
  }

  // הערכת מחיר של סט - דורש גישה לנתוני שוק חיצוניים
  async estimateSetPrice(setName: string, condition: 'new' | 'used' | 'sealed'): Promise<string> {
    this.checkRateLimit();
    const conditionMap: Record<string, string> = { new: 'חדש', used: 'משומש', sealed: 'אטום במארז מקורי' };
    const chat = this.modelWithSearch.startChat();
    try {
      const result = await chat.sendMessage(
        `חפש ומצא את המחיר הנוכחי של "${setName}" במצב ${conditionMap[condition]} ב-BrickLink, eBay ו-Amazon. הצג השוואת מחירים ומגמת שוק.`
      );
      return result.response.text().trim();
    } catch (error) {
      console.error('estimateSetPrice failed:', error);
      throw new Error('שגיאה בהערכת המחיר. אנא נסה שוב.');
    }
  }

  // חיפוש סטים לפי קריטריונים (גיל/נושא/גודל/מחיר)
  async findSets(criteria: string): Promise<string> {
    this.checkRateLimit();
    const chat = this.modelWithSearch.startChat();
    try {
      const result = await chat.sendMessage(
        `חפש וצא 3-5 סטי LEGO לפי: ${criteria}. כלול מספר סט, תיאור, מחיר נוכחי ממקורות אמיתיים.`
      );
      return result.response.text().trim();
    } catch (error) {
      console.error('findSets failed:', error);
      throw new Error('שגיאה בחיפוש הסטים. אנא נסה שוב.');
    }
  }
}

export const aiService = new AIService();
