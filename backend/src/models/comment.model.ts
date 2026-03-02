import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IComment extends Document {
  text: string;
  author: Types.ObjectId;
  post: Types.ObjectId;
  createdAt: Date;
}

const commentSchema = new Schema<IComment>({
  text: {
    type: String,
    required: true
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  post: {
    type: Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Comment: Model<IComment> = mongoose.model<IComment>('Comment', commentSchema);
export default Comment;
