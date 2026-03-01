const Post = require('../models/post.model');
const Comment = require('../models/comment.model');

const getAllPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
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
    res.status(500).json({ message: 'Failed to get posts', error: error.message });
  }
};

const getPostById = async (req, res) => {
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
    res.status(500).json({ message: 'Failed to get post', error: error.message });
  }
};

const createPost = async (req, res) => {
  try {
    const { text } = req.body;
    const image = req.file ? `/uploads/posts/${req.file.filename}` : '';

    const post = new Post({
      text,
      image,
      author: req.userId
    });

    await post.save();
    await post.populate('author', 'username profileImage');

    res.status(201).json({ post });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create post', error: error.message });
  }
};

const updatePost = async (req, res) => {
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
    res.status(500).json({ message: 'Failed to update post', error: error.message });
  }
};

const deletePost = async (req, res) => {
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
    res.status(500).json({ message: 'Failed to delete post', error: error.message });
  }
};

const toggleLike = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const userId = req.userId;
    const likeIndex = post.likes.indexOf(userId);

    if (likeIndex > -1) {
      post.likes.splice(likeIndex, 1);
    } else {
      post.likes.push(userId);
    }

    await post.save();
    await post.populate('author', 'username profileImage');
    await post.populate('likes', 'username');

    res.json({ post, liked: likeIndex === -1 });
  } catch (error) {
    res.status(500).json({ message: 'Failed to toggle like', error: error.message });
  }
};

module.exports = {
  getAllPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
  toggleLike
};
