import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  user:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content:    { type: String, required: true, maxlength: 1000 },
  likes:      [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  likesCount: { type: Number, default: 0 },
  isEdited:   { type: Boolean, default: false },
  replies: [{
    user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, maxlength: 500 },
    likes:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    createdAt: { type: Date, default: Date.now },
  }],
}, { timestamps: true });

const postSchema = new mongoose.Schema({
  author:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true, maxlength: 2200 },
  images:  [{ url: { type: String, required: true }, publicId: { type: String, required: true }, alt: String }],
  video:   { url: String, publicId: String, thumbnail: String },
  tags:    [{ type: String, lowercase: true, trim: true }],
  mentions:[{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  likes:        [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  likesCount:   { type: Number, default: 0 },
  comments:     [commentSchema],
  commentsCount:{ type: Number, default: 0 },
  saves:        [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  savesCount:   { type: Number, default: 0 },
  isRepost:     { type: Boolean, default: false },
  originalPost: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
  visibility:   { type: String, enum: ['public','followers','private'], default: 'public' },
  isEdited:     { type: Boolean, default: false },
  isDeleted:    { type: Boolean, default: false },
  viewsCount:   { type: Number, default: 0 },
  engagementScore: { type: Number, default: 0 },
}, { timestamps: true });

postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ tags: 1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ engagementScore: -1 });
postSchema.index({ content: 'text', tags: 'text' });

postSchema.pre('save', function (next) {
  this.engagementScore = this.likesCount + this.commentsCount * 2 + this.savesCount * 1.5 + this.viewsCount * 0.1;
  next();
});

export default mongoose.model('Post', postSchema);
