import { Request, Response } from 'express';
import User from '../models/user.model';
import Post from '../models/post.model';

export const getUserProfile = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to get user profile',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const updateUserProfile = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    if (req.userId !== req.params.id) {
      return res.status(403).json({ message: 'You can only update your own profile' });
    }

    const { username } = req.body;
    const updateData: { username?: string; profileImage?: string } = {};

    if (username) updateData.username = username;
    if (req.file) {
      updateData.profileImage = `/uploads/profiles/${req.file.filename}`;
    }

    const user = await User.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    }).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage
      }
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to update profile',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getUserPosts = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const posts = await Post.find({ author: req.params.id })
      .populate('author', 'username profileImage')
      .sort({ createdAt: -1 });

    res.json({ posts });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to get user posts',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
