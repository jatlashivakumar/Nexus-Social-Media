import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const userSchema = new mongoose.Schema({
  username:  { type: String, required: true, unique: true, trim: true, lowercase: true, minlength: 3, maxlength: 30, match: /^[a-zA-Z0-9_]+$/ },
  email:     { type: String, required: true, unique: true, trim: true, lowercase: true },
  password:  { type: String, required: true, minlength: 8, select: false },
  googleId:  { type: String, unique: true, sparse: true, index: true },
  name:      { type: String, trim: true, maxlength: 50 },
  bio:       { type: String, maxlength: 160 },
  avatar:    { url: { type: String, default: '' }, publicId: { type: String, default: '' } },
  coverImage:{ url: { type: String, default: '' }, publicId: { type: String, default: '' } },
  website:   { type: String, maxlength: 100 },
  location:  { type: String, maxlength: 50 },
  role:      { type: String, enum: ['user','moderator','admin'], default: 'user' },
  subscription: { type: String, enum: ['free','pro','creator'], default: 'free' },
  isVerified:{ type: Boolean, default: false },
  isActive:  { type: Boolean, default: true },
  isPrivate: { type: Boolean, default: false },
  followers:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  savedPosts:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
  refreshTokens: [{
    token: String, createdAt: { type: Date, default: Date.now },
    expiresAt: Date, userAgent: String, ip: String,
  }],
  emailVerificationToken:  String,
  emailVerificationExpire: Date,
  passwordResetToken:      String,
  passwordResetExpire:     Date,
  passwordChangedAt:       Date,
  postsCount:      { type: Number, default: 0 },
  followersCount:  { type: Number, default: 0 },
  followingCount:  { type: Number, default: 0 },
  notifications: {
    email:    { type: Boolean, default: true },
    push:     { type: Boolean, default: true },
    follows:  { type: Boolean, default: true },
    likes:    { type: Boolean, default: true },
    comments: { type: Boolean, default: true },
    messages: { type: Boolean, default: true },
  },
  lastSeen:     { type: Date, default: Date.now },
  onlineStatus: { type: String, enum: ['online','away','offline'], default: 'offline' },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

userSchema.index({ username: 'text', name: 'text' });
userSchema.index({ email: 1 });
userSchema.index({ createdAt: -1 });

userSchema.virtual('avatarUrl').get(function () {
  return this.avatar?.url ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${this.username}&backgroundColor=6366f1&textColor=ffffff`;
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  if (!this.isNew) this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.methods.comparePassword      = function (p) { return bcrypt.compare(p, this.password); };
userSchema.methods.changedPasswordAfter = function (iat) {
  return this.passwordChangedAt
    ? parseInt(this.passwordChangedAt.getTime() / 1000) > iat
    : false;
};

userSchema.methods.createEmailVerificationToken = function () {
  const token = crypto.randomBytes(32).toString('hex');
  this.emailVerificationToken  = crypto.createHash('sha256').update(token).digest('hex');
  this.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000;
  return token;
};

userSchema.methods.createPasswordResetToken = function () {
  const token = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken  = crypto.createHash('sha256').update(token).digest('hex');
  this.passwordResetExpire = Date.now() + 10 * 60 * 1000;
  return token;
};

userSchema.methods.cleanExpiredTokens = function () {
  this.refreshTokens = this.refreshTokens.filter((t) => t.expiresAt > Date.now());
};

userSchema.methods.toPublicJSON = function () {
  const o = this.toObject();
  delete o.password; delete o.refreshTokens;
  delete o.emailVerificationToken; delete o.emailVerificationExpire;
  delete o.passwordResetToken; delete o.passwordResetExpire;
  delete o.passwordChangedAt; delete o.blockedUsers;
  return o;
};

export default mongoose.model('User', userSchema);
