import Post from '../models/Post.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { deleteCloudinaryAsset } from '../config/cloudinary.js';
import { getSocketIO } from '../socket/socket.js';

export const createPost = asyncHandler(async (req, res) => {
  const { content, visibility, tags } = req.body;
  const images = req.files?.map((f) => ({ url: f.path, publicId: f.filename })) || [];
  const mentionUsernames = (content.match(/@(\w+)/g) || []).map((m) => m.slice(1));
  const mentionedUsers   = mentionUsernames.length ? await User.find({ username: { $in: mentionUsernames } }).select('_id username notifications') : [];
  const contentTags = (content.match(/#(\w+)/g) || []).map((t) => t.slice(1).toLowerCase());
  const allTags     = [...new Set([...(tags || []), ...contentTags])];
  const post = await Post.create({ author: req.user._id, content, images, visibility: visibility || 'public', tags: allTags, mentions: mentionedUsers.map((u) => u._id) });
  await User.findByIdAndUpdate(req.user._id, { $inc: { postsCount: 1 } });
  const io = getSocketIO();
  for (const mentioned of mentionedUsers) {
    if (mentioned._id.toString() === req.user._id.toString() || !mentioned.notifications?.mentions) continue;
    const notif = await Notification.create({ recipient: mentioned._id, sender: req.user._id, type: 'mention', entityType: 'Post', entityId: post._id, message: `${req.user.username} mentioned you in a post.` });
    io?.to(`user:${mentioned._id}`).emit('notification', notif);
  }
  await post.populate('author', 'username name avatar isVerified');
  res.status(201).json({ success: true, data: post });
});

export const getFeed = asyncHandler(async (req, res) => {
  const page = +req.query.page || 1; const limit = Math.min(+req.query.limit || 20, 50);
  const user = await User.findById(req.user._id).select('following');
  const ids  = [req.user._id, ...user.following];
  const posts = await Post.find({ author: { $in: ids }, isDeleted: false, $or: [{ visibility: 'public' }, { author: req.user._id }] })
    .sort({ createdAt: -1 }).skip((page-1)*limit).limit(limit)
    .populate('author', 'username name avatar isVerified onlineStatus')
    .lean();
  const enriched = posts.map((p) => ({ ...p, isLiked: p.likes.some((id) => id.toString() === req.user._id.toString()), isSaved: p.saves.some((id) => id.toString() === req.user._id.toString()) }));
  const total = await Post.countDocuments({ author: { $in: ids }, isDeleted: false });
  res.status(200).json({ success: true, data: enriched, meta: { total, page, limit, totalPages: Math.ceil(total/limit), hasNextPage: page < Math.ceil(total/limit) } });
});

export const getExplorePosts = asyncHandler(async (req, res) => {
  const page = +req.query.page || 1; const limit = Math.min(+req.query.limit || 20, 50);
  const filter = { visibility: 'public', isDeleted: false };
  if (req.query.tag) filter.tags = req.query.tag.toLowerCase();
  if (req.query.q)   filter.$text = { $search: req.query.q };
  const posts = await Post.find(filter).sort({ engagementScore: -1, createdAt: -1 })
    .skip((page-1)*limit).limit(limit)
    .populate('author', 'username name avatar isVerified').lean();
  res.status(200).json({ success: true, data: posts });
});

export const getPost = asyncHandler(async (req, res, next) => {
  const post = await Post.findById(req.params.id)
    .populate('author', 'username name avatar isVerified bio followersCount')
    .populate('comments.user', 'username name avatar isVerified')
    .populate('comments.replies.user', 'username name avatar');
  if (!post || post.isDeleted) return next(new AppError('Post not found.', 404));
  await Post.findByIdAndUpdate(post._id, { $inc: { viewsCount: 1 } });
  const obj = post.toObject();
  if (req.user) { obj.isLiked = post.likes.some((id) => id.toString() === req.user._id.toString()); obj.isSaved = post.saves.some((id) => id.toString() === req.user._id.toString()); }
  res.status(200).json({ success: true, data: obj });
});

export const toggleLike = asyncHandler(async (req, res, next) => {
  const post = await Post.findById(req.params.id);
  if (!post || post.isDeleted) return next(new AppError('Post not found.', 404));
  const isLiked = post.likes.map(String).includes(req.user._id.toString());
  await Post.findByIdAndUpdate(post._id, isLiked
    ? { $pull: { likes: req.user._id }, $inc: { likesCount: -1 } }
    : { $addToSet: { likes: req.user._id }, $inc: { likesCount: 1 } });
  if (!isLiked && post.author.toString() !== req.user._id.toString()) {
    const author = await User.findById(post.author).select('notifications');
    if (author?.notifications?.likes && !(await Notification.findOne({ recipient: post.author, sender: req.user._id, type: 'like', entityId: post._id }))) {
      const notif = await Notification.create({ recipient: post.author, sender: req.user._id, type: 'like', entityType: 'Post', entityId: post._id, message: `${req.user.username} liked your post.` });
      getSocketIO()?.to(`user:${post.author}`).emit('notification', notif);
    }
  }
  res.status(200).json({ success: true, data: { isLiked: !isLiked } });
});

export const addComment = asyncHandler(async (req, res, next) => {
  const post = await Post.findById(req.params.id);
  if (!post || post.isDeleted) return next(new AppError('Post not found.', 404));
  post.comments.push({ user: req.user._id, content: req.body.content });
  post.commentsCount += 1;
  await post.save();
  await post.populate('comments.user', 'username name avatar isVerified');
  const newComment = post.comments[post.comments.length - 1];
  if (post.author.toString() !== req.user._id.toString()) {
    const author = await User.findById(post.author).select('notifications');
    if (author?.notifications?.comments) {
      const notif = await Notification.create({ recipient: post.author, sender: req.user._id, type: 'comment', entityType: 'Post', entityId: post._id, message: `${req.user.username} commented on your post.` });
      getSocketIO()?.to(`user:${post.author}`).emit('notification', notif);
    }
  }
  res.status(201).json({ success: true, data: post.comments.find((c) => c._id.toString() === newComment._id.toString()) });
});

export const deleteComment = asyncHandler(async (req, res, next) => {
  const post = await Post.findById(req.params.id);
  if (!post) return next(new AppError('Post not found.', 404));
  const comment = post.comments.id(req.params.commentId);
  if (!comment) return next(new AppError('Comment not found.', 404));
  const isOwner = comment.user.toString() === req.user._id.toString();
  const isPostAuthor = post.author.toString() === req.user._id.toString();
  if (!isOwner && !isPostAuthor && !['admin','moderator'].includes(req.user.role))
    return next(new AppError('Not authorized.', 403));
  comment.deleteOne();
  post.commentsCount = Math.max(0, post.commentsCount - 1);
  await post.save();
  res.status(200).json({ success: true, message: 'Comment deleted.' });
});

export const toggleSave = asyncHandler(async (req, res, next) => {
  const post = await Post.findById(req.params.id);
  if (!post || post.isDeleted) return next(new AppError('Post not found.', 404));
  const isSaved = post.saves.map(String).includes(req.user._id.toString());
  await Post.findByIdAndUpdate(post._id, { [isSaved ? '$pull' : '$addToSet']: { saves: req.user._id }, $inc: { savesCount: isSaved ? -1 : 1 } });
  await User.findByIdAndUpdate(req.user._id, { [isSaved ? '$pull' : '$addToSet']: { savedPosts: post._id } });
  res.status(200).json({ success: true, data: { isSaved: !isSaved } });
});

export const deletePost = asyncHandler(async (req, res, next) => {
  const post = await Post.findById(req.params.id);
  if (!post) return next(new AppError('Post not found.', 404));
  const isOwner = post.author.toString() === req.user._id.toString();
  if (!isOwner && !['admin','moderator'].includes(req.user.role)) return next(new AppError('Not authorized.', 403));
  post.isDeleted = true; post.deletedAt = Date.now();
  await post.save();
  post.images.forEach((img) => { if (img.publicId) deleteCloudinaryAsset(img.publicId); });
  if (isOwner) await User.findByIdAndUpdate(req.user._id, { $inc: { postsCount: -1 } });
  res.status(200).json({ success: true, message: 'Post deleted.' });
});

export const getUserPosts = asyncHandler(async (req, res, next) => {
  const page = +req.query.page || 1; const limit = Math.min(+req.query.limit || 20, 50);
  const user = await User.findOne({ username: req.params.username });
  if (!user) return next(new AppError('User not found.', 404));
  const visFilter = req.user?._id.toString() === user._id.toString() ? {} : { visibility: 'public' };
  const posts = await Post.find({ author: user._id, isDeleted: false, ...visFilter })
    .sort({ createdAt: -1 }).skip((page-1)*limit).limit(limit)
    .populate('author', 'username name avatar isVerified').lean();
  const total = await Post.countDocuments({ author: user._id, isDeleted: false, ...visFilter });
  res.status(200).json({ success: true, data: posts, meta: { total, page, limit, totalPages: Math.ceil(total/limit) } });
});

export const searchPosts = asyncHandler(async (req, res) => {
  const { q, tag, page = 1, limit = 20 } = req.query;
  const filter = { isDeleted: false, visibility: 'public' };
  if (tag) filter.tags = tag.toLowerCase();
  if (q)   filter.$text = { $search: q };
  const posts = await Post.find(filter)
    .sort(q ? { score: { $meta: 'textScore' } } : { createdAt: -1 })
    .skip((+page-1)*+limit).limit(+limit)
    .populate('author', 'username name avatar isVerified').lean();
  res.status(200).json({ success: true, data: posts });
});
