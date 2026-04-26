import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Message from '../models/message.model';
import User from '../models/user.model';

// בדיקה שהמחרוזת היא ObjectId תקין כדי להחזיר 400 ולא 500 על קלט שגוי
function isValidId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id);
}

// שליחת הודעה למשתמש אחר
export const sendMessage = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const senderId = req.userId;
    const { recipient, text } = req.body as { recipient?: string; text?: string };

    if (!senderId) return res.status(401).json({ message: 'Unauthorized' });
    if (!recipient || !text || !text.trim()) {
      return res.status(400).json({ message: 'recipient ו-text נדרשים' });
    }
    if (!isValidId(recipient)) {
      return res.status(400).json({ message: 'recipient לא תקין' });
    }
    if (recipient === senderId) {
      return res.status(400).json({ message: 'לא ניתן לשלוח הודעה לעצמך' });
    }

    const recipientUser = await User.findById(recipient).select('_id');
    if (!recipientUser) return res.status(404).json({ message: 'Recipient not found' });

    const message = await Message.create({
      sender: senderId,
      recipient,
      text: text.trim(),
      read: false,
    });

    res.status(201).json({ message });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to send message',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// רשימת השיחות של המשתמש - לכל שיחה: המשתמש האחר, ההודעה האחרונה ומונה לא נקראו
export const getConversations = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const me = new mongoose.Types.ObjectId(userId);

    // אגרגציה: עבור כל שיחה (זוג) שולפים את ההודעה האחרונה ואת מספר ההודעות שטרם נקראו
    const conversations = await Message.aggregate([
      { $match: { $or: [{ sender: me }, { recipient: me }] } },
      { $sort: { createdAt: -1 } },
      {
        $addFields: {
          otherUser: {
            $cond: [{ $eq: ['$sender', me] }, '$recipient', '$sender']
          }
        }
      },
      {
        $group: {
          _id: '$otherUser',
          lastMessage: { $first: '$$ROOT' },
          unread: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$recipient', me] }, { $eq: ['$read', false] }] },
                1,
                0
              ]
            }
          }
        }
      },
      { $sort: { 'lastMessage.createdAt': -1 } },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: 0,
          userId: '$_id',
          username: '$user.username',
          email: '$user.email',
          profileImage: '$user.profileImage',
          lastMessage: {
            text: '$lastMessage.text',
            createdAt: '$lastMessage.createdAt',
            senderId: '$lastMessage.sender'
          },
          unread: 1
        }
      }
    ]);

    res.json({ conversations });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to get conversations',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// שליפת כל ההודעות עם משתמש מסויים + סימון כל ההודעות שלו אליי כנקראו
export const getThread = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const userId = req.userId;
    const otherId = req.params.userId as string;

    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    if (!isValidId(otherId)) return res.status(400).json({ message: 'userId לא תקין' });

    const messages = await Message.find({
      $or: [
        { sender: userId, recipient: otherId },
        { sender: otherId, recipient: userId }
      ]
    }).sort({ createdAt: 1 });

    // סימון הודעות נכנסות מהצד השני כנקראו
    await Message.updateMany(
      { sender: otherId, recipient: userId, read: false },
      { $set: { read: true } }
    );

    res.json({ messages });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to get thread',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// מספר ההודעות הלא-נקראות של המשתמש המחובר (לבאדג' האדום)
export const getUnreadCount = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const count = await Message.countDocuments({ recipient: userId, read: false });
    res.json({ count });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to get unread count',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
