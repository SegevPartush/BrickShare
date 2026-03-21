import '../types/express-augment';
import { Request, Response } from 'express';
import { aiService } from '../services/ai.service';

export const askAssistant = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'חסרה שאלה' });
    }
    const response = await aiService.askAssistant(message.trim());
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
