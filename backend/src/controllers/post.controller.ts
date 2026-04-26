import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Post from '../models/post.model';
import Comment from '../models/comment.model';
import { aiService } from '../services/ai.service';

export const getAllPosts = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const posts = await Post.find()
      .populate('author', 'username profileImage')
      .populate('likes', 'username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const postsWithComments = await Promise.all(
      posts.map(async (post) => {
        const commentCount = await Comment.countDocuments({ post: post._id });
        return {
          ...post.toObject(),
          commentCount
        };
      })
    );

    const total = await Post.countDocuments();

    res.json({
      posts: postsWithComments,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalPosts: total
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to get posts',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const searchPosts = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { q } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({ message: 'Query required' });
    }

    const posts = await Post.find()
      .populate('author', 'username profileImage')
      .limit(50)
      .sort({ createdAt: -1 })
      .lean();

    const searchResults = await aiService.smartSearch(q, posts);

    const relevantPosts = searchResults
      .map((result) => {
        const post = posts.find((p) => p._id.toString() === result.postId);
        if (!post) return null;
        return {
          ...post,
          relevance: result.relevanceScore,
          matchReason: result.reason
        };
      })
      .filter(Boolean);

    res.json({
      query: q,
      results: relevantPosts,
      count: relevantPosts.length
    });
  } catch (error) {
    res.status(500).json({
      message: 'Search failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getSuggestions = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const userPosts = await Post.find({ author: req.userId })
      .limit(10)
      .select('text');
    const interests = userPosts.map((p) => p.text).slice(0, 5);
    const suggestions = await aiService.generateSuggestions(interests);

    res.json({ suggestions });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to get suggestions',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getPostById = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'username profileImage')
      .populate('likes', 'username');

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const commentCount = await Comment.countDocuments({ post: post._id });
    const postWithComments = {
      ...post.toObject(),
      commentCount
    };

    res.json({ post: postWithComments });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to get post',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const createPost = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const rawText = req.body?.text !== undefined && req.body?.text !== null ? String(req.body.text) : '';
    const image = req.file ? `/uploads/posts/${req.file.filename}` : '';
    const text = rawText.trim() || (image ? '📷' : '');

    const post = new Post({
      text,
      image,
      author: req.userId
    });

    await post.save();
    await post.populate('author', 'username profileImage');

    res.status(201).json({ post });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to create post',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const updatePost = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { text } = req.body;

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.author.toString() !== req.userId) {
      return res.status(403).json({ message: 'You can only update your own posts' });
    }

    if (text !== undefined) post.text = text;
    if (req.file) {
      post.image = `/uploads/posts/${req.file.filename}`;
    }

    await post.save();
    await post.populate('author', 'username profileImage');

    res.json({ post });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to update post',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const deletePost = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.author.toString() !== req.userId) {
      return res.status(403).json({ message: 'You can only delete your own posts' });
    }

    await Post.findByIdAndDelete(req.params.id);

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to delete post',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const toggleLike = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const userId = new mongoose.Types.ObjectId(req.userId as string);
    const postId = req.params.id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const alreadyLiked = post.likes.some((id) => id.toString() === req.userId);
    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      alreadyLiked ? { $pull: { likes: userId } } : { $addToSet: { likes: userId } },
      { new: true }
    )
      .populate('author', 'username profileImage')
      .populate('likes', 'username');

    res.json({ post: updatedPost, liked: !alreadyLiked });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to toggle like',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
