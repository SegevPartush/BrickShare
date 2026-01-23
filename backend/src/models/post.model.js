const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  setName: {
    type: String,
    required: true
  },
  setNumber: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  imageEmoji: {
    type: String,
    default: '🧱'
  },
  sender: {
    type: String,
    required: true
  },
  likes: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Post', postSchema);