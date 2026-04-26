import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IPost extends Document {
  text: string;
  image: string;
  /** אחוזים ל־object-position: איך ממקמים את התמונה בפריים 16:9 (ברירת 50,50 = מרכז) */
  imageFocalX: number;
  imageFocalY: number;
  author: Types.ObjectId;
  likes: Types.ObjectId[];
  createdAt: Date;
}

const postSchema = new Schema<IPost>({
  text: {
    type: String,
    required: true
  },
  image: {
    type: String,
    default: ''
  },
  imageFocalX: {
    type: Number,
    default: 50,
    min: 0,
    max: 100
  },
  imageFocalY: {
    type: Number,
    default: 50,
    min: 0,
    max: 100
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  likes: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ createdAt: -1 });

const Post: Model<IPost> = mongoose.model<IPost>('Post', postSchema);
export default Post;
