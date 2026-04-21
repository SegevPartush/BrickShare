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

const SYSTEM_PROMPT = `You are an expert LEGO assistant for BrickShare — a social network for LEGO collectors.

Your behavior:
- Remember everything discussed in this conversation. If the user says "tell me more" or "what about that set" — refer back to what was said earlier.
- Always respond in the same language as the user's question (Hebrew → Hebrew, English → English).
- Be specific and direct. Give real set numbers, prices, and names — not vague answers.
- Structure: start with a short direct answer (1–3 sentences), then add bullets or details only if needed.
- When asked about prices, search for current data from BrickLink, eBay, and Amazon.
- When app data is provided, mention the specific user selling a set and compare to market price.
- If the user asks a follow-up question, treat it in full context of the ongoing conversation.
- Keep responses concise but complete. Use bullet points for lists.
- Never say "I don't have access to real-time data" — you do, via Google Search.`;

/** פחות "הזיות", תשובות יותר עקביות — בלי עוד קריאות API */
const CHAT_GENERATION = {
  temperature: 0.42,
  topP: 0.88,
  /** מגביל פלט ארוך מדי = פחות טוקני פלט ועלות */
  maxOutputTokens: 1408,
} as const;

/** רק 6 סבבים אחרונים (12 הודעות) — פחות טוקנים בקלט, פחות רעש, אותה קריאה אחת */
const MAX_HISTORY_MESSAGES = 12;

export class AIService {
  private modelWithSearch = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    tools: [{ googleSearch: {} } as any],
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: CHAT_GENERATION,
  });

  private model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: CHAT_GENERATION,
  });

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

  private needsWebSearch(message: string): boolean {
    const keywords = ['מחיר', 'שווה', 'עולה', 'קונים', 'מוכרים', 'השוואה', 'bricklink', 'ebay', 'amazon', 'price', 'worth', 'cost', 'market', 'compare', 'buy', 'sell'];
    const lower = message.toLowerCase();
    return keywords.some(kw => lower.includes(kw));
  }

  // Convert frontend history to Gemini format
  private toGeminiHistory(history: ChatMessage[]) {
    return history.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));
  }

  /** חיתוך היסטוריה: נשארים רק ההודעות האחרונות — חוסך טוקני קלט בלי קריאה נוספת */
  private trimHistory(history: ChatMessage[]): ChatMessage[] {
    if (history.length <= MAX_HISTORY_MESSAGES) return this.ensureHistoryStartsWithUser(history);
    return this.ensureHistoryStartsWithUser(history.slice(-MAX_HISTORY_MESSAGES));
  }

  /** Gemini דורש שה-history יתחיל מ-user */
  private ensureHistoryStartsWithUser(history: ChatMessage[]): ChatMessage[] {
    let h = [...history];
    while (h.length > 0 && h[0].role === 'assistant') {
      h = h.slice(1);
    }
    return h;
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

  async askAssistant(userMessage: string, appContext?: string, history: ChatMessage[] = []): Promise<string> {
    this.checkRateLimit();

    const activeModel = this.needsWebSearch(userMessage) ? this.modelWithSearch : this.model;

    const trimmed = this.trimHistory(history);
    const geminiHistory = this.toGeminiHistory(trimmed);

    // Append app context to the current message if available
    const fullMessage = appContext
      ? `${userMessage}\n\n[נתונים מ-BrickShare: ${appContext}]`
      : userMessage;

    try {
      const chat = activeModel.startChat({ history: geminiHistory });
      const result = await chat.sendMessage(fullMessage);
      return result.response.text().trim();
    } catch (error) {
      console.error('askAssistant failed:', error);
      try {
        const chat = this.model.startChat({ history: geminiHistory });
        const fallback = await chat.sendMessage(fullMessage);
        return fallback.response.text().trim();
      } catch {
        throw new Error('שגיאה בתקשורת עם מערכת ה-AI. אנא נסה שוב.');
      }
    }
  }

  async estimateSetPrice(setName: string, condition: 'new' | 'used' | 'sealed'): Promise<string> {
    this.checkRateLimit();
    const conditionMap: Record<string, string> = { new: 'חדש', used: 'משומש', sealed: 'אטום במארז מקורי' };
    const chat = this.modelWithSearch.startChat();
    try {
      const result = await chat.sendMessage(`חפש ומצא את המחיר הנוכחי של "${setName}" במצב ${conditionMap[condition]} ב-BrickLink, eBay ו-Amazon. הצג השוואת מחירים ומגמת שוק.`);
      return result.response.text().trim();
    } catch (error) {
      console.error('estimateSetPrice failed:', error);
      throw new Error('שגיאה בהערכת המחיר. אנא נסה שוב.');
    }
  }

  async findSets(criteria: string): Promise<string> {
    this.checkRateLimit();
    const chat = this.modelWithSearch.startChat();
    try {
      const result = await chat.sendMessage(`חפש וצא 3-5 סטי LEGO לפי: ${criteria}. כלול מספר סט, תיאור, מחיר נוכחי ממקורות אמיתיים.`);
      return result.response.text().trim();
    } catch (error) {
      console.error('findSets failed:', error);
      throw new Error('שגיאה בחיפוש הסטים. אנא נסה שוב.');
    }
  }
}

export const aiService = new AIService();
