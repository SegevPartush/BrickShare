import { Request, Response } from 'express';
import Comment from '../models/comment.model';
import Post from '../models/post.model';

export const getPostComments = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const comments = await Comment.find({ post: req.params.id })
      .populate('author', 'username profileImage')
      .sort({ createdAt: -1 });

    res.json({ comments });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to get comments',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const createComment = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { text } = req.body;

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = new Comment({
      text,
      author: req.userId,
      post: req.params.id
    });

    await comment.save();
    await comment.populate('author', 'username profileImage');

    res.status(201).json({ comment });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to create comment',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const updateComment = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { text } = req.body;

    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (comment.author.toString() !== req.userId) {
      return res.status(403).json({ message: 'You can only update your own comments' });
    }

    comment.text = text;
    await comment.save();
    await comment.populate('author', 'username profileImage');

    res.json({ comment });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to update comment',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const deleteComment = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (comment.author.toString() !== req.userId) {
      return res.status(403).json({ message: 'You can only delete your own comments' });
    }

    await Comment.findByIdAndDelete(req.params.id);

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to delete comment',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
