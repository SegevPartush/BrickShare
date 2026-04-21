import { Request, Response } from 'express';
import User from '../models/user.model';
import Post from '../models/post.model';
import Comment from '../models/comment.model';

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
        coverImage: user.coverImage,
        createdAt: user.createdAt,
        followersCount: user.followers?.length ?? 0,
        followingCount: user.following?.length ?? 0,
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
    const updateData: { username?: string; profileImage?: string; coverImage?: string } = {};

    if (username) updateData.username = username;

    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    if (files?.profileImage?.[0]) {
      updateData.profileImage = `/uploads/profiles/${files.profileImage[0].filename}`;
    } else if (req.file) {
      updateData.profileImage = `/uploads/profiles/${req.file.filename}`;
    }
    if (files?.coverImage?.[0]) {
      updateData.coverImage = `/uploads/covers/${files.coverImage[0].filename}`;
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
        profileImage: user.profileImage,
        coverImage: user.coverImage,
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

    const postsWithComments = await Promise.all(
      posts.map(async (post) => {
        const commentCount = await Comment.countDocuments({ post: post._id });
        return { ...post.toObject(), commentCount };
      })
    );

    res.json({ posts: postsWithComments });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to get user posts',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const toggleFollow = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const currentUserId = req.userId;
    const targetUserId = req.params.id as string;

    if (!currentUserId) return res.status(401).json({ message: 'Unauthorized' });
    if (!targetUserId) return res.status(400).json({ message: 'Target user id required' });
    if (currentUserId === targetUserId) return res.status(400).json({ message: 'Cannot follow yourself' });

    const currentUser = await User.findById(currentUserId);
    const targetUser = await User.findById(targetUserId);

    if (!currentUser || !targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const followingSet = new Set(currentUser.following.map((id) => id.toString()));
    const isFollowing = followingSet.has(targetUserId);

    if (isFollowing) {
      currentUser.following = currentUser.following.filter((id) => id.toString() !== targetUserId);
      targetUser.followers = targetUser.followers.filter((id) => id.toString() !== currentUserId);
    } else {
      currentUser.following.push(targetUser._id);
      targetUser.followers.push(currentUser._id);
    }

    await currentUser.save();
    await targetUser.save();

    res.json({ following: !isFollowing });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to toggle follow',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getFollowers = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const targetUserId = req.params.id as string;
    const currentUserId = req.userId;

    if (!targetUserId) return res.status(400).json({ message: 'Target user id required' });

    const targetUser = await User.findById(targetUserId).select('followers');
    if (!targetUser) return res.status(404).json({ message: 'User not found' });

    let currentFollowingSet = new Set<string>();
    if (currentUserId) {
      const currentUser = await User.findById(currentUserId).select('following');
      currentFollowingSet = new Set((currentUser?.following || []).map((id) => id.toString()));
    }

    const followers = await User.find({ _id: { $in: targetUser.followers } })
      .select('username email profileImage')
      .lean();

    const result = followers.map((u: any) => ({
      ...u,
      id: u._id,
      isFollowing: currentFollowingSet.has(u._id.toString())
    }));

    res.json({ followers: result });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to get followers',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getSuggestedUsers = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const currentUserId = req.userId;
    const limit = parseInt(req.query.limit as string) || 5;

    let excludeIds: string[] = [];
    if (currentUserId) {
      const currentUser = await User.findById(currentUserId).select('following');
      excludeIds = (currentUser?.following || []).map((id) => id.toString());
      excludeIds.push(currentUserId);
    }

    const users = await User.find({ _id: { $nin: excludeIds } })
      .select('username email profileImage followers')
      .limit(limit)
      .lean();

    const result = users.map((u: any) => ({
      id: u._id,
      username: u.username,
      email: u.email,
      profileImage: u.profileImage,
      followersCount: (u.followers || []).length,
      isFollowing: false
    }));

    res.json({ users: result });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to get suggested users',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getFollowing = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const targetUserId = req.params.id as string;
    const currentUserId = req.userId;

    if (!targetUserId) return res.status(400).json({ message: 'Target user id required' });

    const targetUser = await User.findById(targetUserId).select('following');
    if (!targetUser) return res.status(404).json({ message: 'User not found' });

    let currentFollowingSet = new Set<string>();
    if (currentUserId) {
      const currentUser = await User.findById(currentUserId).select('following');
      currentFollowingSet = new Set((currentUser?.following || []).map((id) => id.toString()));
    }

    const following = await User.find({ _id: { $in: targetUser.following } })
      .select('username email profileImage')
      .lean();

    const result = following.map((u: any) => ({
      ...u,
      id: u._id,
      isFollowing: currentFollowingSet.has(u._id.toString())
    }));

    res.json({ following: result });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to get following',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
