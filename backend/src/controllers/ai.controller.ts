import '../types/express-augment';
import { Request, Response } from 'express';
import { aiService } from '../services/ai.service';
import Post from '../models/post.model';

// מחפש פוסטים רלוונטיים לשאלה ומחזיר כהקשר לAI
async function buildAppContext(query: string): Promise<string> {
  try {
    // מילות מפתח מהשאלה
    const words = query.replace(/[^\u0590-\u05FF\w\s]/g, '').split(/\s+/).filter(w => w.length > 2);
    if (words.length === 0) return '';

    const regexPattern = words.join('|');
    const posts = await Post.find({
      text: { $regex: regexPattern, $options: 'i' }
    })
      .populate('author', 'username email profileImage')
      .limit(8)
      .sort({ createdAt: -1 })
      .lean();

    if (posts.length === 0) return '';

    const lines = posts.map((p: any) => {
      const author = p.author?.username || p.author?.email || 'משתמש';
      return `- המשתמש "${author}" כתב: "${p.text}"`;
    });

    return lines.join('\n');
  } catch {
    return '';
  }
}

export const askAssistant = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'חסרה שאלה' });
    }

    // מביא נתונים רלוונטיים מהאפליקציה לפני הקריאה לAI
    const appContext = await buildAppContext(message.trim());
    const response = await aiService.askAssistant(message.trim(), appContext || undefined);
    res.json({ response });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'שגיאה בשרת' });
  }
};

export const estimatePrice = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { setName, condition } = req.body;
    if (!setName || !setName.trim()) {
      return res.status(400).json({ message: 'חסר שם הסט' });
    }
    // אם לא שלחו condition תקין, ברירת מחדל היא new
    const validConditions = ['new', 'used', 'sealed'];
    const safeCondition = validConditions.includes(condition) ? condition : 'new';
    const response = await aiService.estimateSetPrice(setName.trim(), safeCondition);
    res.json({ response });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'שגיאה בשרת' });
  }
};

export const searchSets = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { criteria } = req.body;
    if (!criteria || !criteria.trim()) {
      return res.status(400).json({ message: 'חסרים קריטריוני חיפוש' });
    }
    const response = await aiService.findSets(criteria.trim());
    res.json({ response });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'שגיאה בשרת' });
  }
};
