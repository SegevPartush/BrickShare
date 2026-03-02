import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface SearchResult {
  postId: string;
  relevanceScore: number;
  reason: string;
}

export class AIService {
  private model = genAI.getGenerativeModel({ model: 'gemini-pro' });
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
      throw new Error('Rate limit exceeded');
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
[
  {
    "postId": "id_here",
    "relevanceScore": 0.9,
    "reason": "explanation"
  }
]

Only include scores above 0.5.
`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) return [];

      const results = JSON.parse(jsonMatch[0]) as SearchResult[];
      return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
    } catch (error) {
      console.error('Search error:', error);
      return [];
    }
  }

  async generateSuggestions(userPosts: string[]): Promise<string[]> {
    this.checkRateLimit();

    const interests = userPosts.join(', ') || 'LEGO building';
    const prompt = `
Based on these interests: ${interests}

Suggest 5 LEGO post ideas.
Return JSON array: ["idea1", "idea2", ...]
`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) return [];

      return JSON.parse(jsonMatch[0]) as string[];
    } catch (error) {
      console.error('Suggestions error:', error);
      return [];
    }
  }
}

export const aiService = new AIService();
