import User from '../models/User.js';
import Notification from '../models/Notification.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { deleteCache } from '../config/redis.js';
import { deleteCloudinaryAsset } from '../config/cloudinary.js';
import { getSocketIO } from '../socket/socket.js';

export const getUserProfile = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ username: req.params.username })
    .select('-password -refreshTokens -emailVerificationToken -passwordResetToken -blockedUsers');
  if (!user || !user.isActive) return next(new AppError('User not found.', 404));
  const isOwnProfile = req.user && req.user._id.toString() === user._id.toString();
  const isFollowing  = req.user && user.followers.some((f) => f.toString() === req.user._id.toString());
  res.status(200).json({ success: true, data: { ...user.toPublicJSON(), isOwnProfile, isFollowing } });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const allowed = ['name', 'bio', 'website', 'location', 'isPrivate', 'notifications'];
  const updates = {};
  allowed.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

  const prev = await User.findById(req.user._id);

  // Handle avatar upload (req.files.avatar from .fields() OR req.file from .single())
  const avatarFile = req.files?.avatar?.[0] || (req.file?.fieldname === 'avatar' ? req.file : null);
  if (avatarFile) {
    if (prev.avatar?.publicId) await deleteCloudinaryAsset(prev.avatar.publicId);
    updates.avatar = { url: avatarFile.path, publicId: avatarFile.filename };
  }

  // Handle cover image upload
  const coverFile = req.files?.coverImage?.[0] || (req.file?.fieldname === 'coverImage' ? req.file : null);
  if (coverFile) {
    if (prev.coverImage?.publicId) await deleteCloudinaryAsset(prev.coverImage.publicId);
    updates.coverImage = { url: coverFile.path, publicId: coverFile.filename };
  }

  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true })
    .select('-password -refreshTokens');
  await deleteCache(`user:${req.user._id}`);
  res.status(200).json({ success: true, data: user.toPublicJSON() });
});

export const toggleFollow = asyncHandler(async (req, res, next) => {
  if (req.params.id === req.user._id.toString()) return next(new AppError('Cannot follow yourself.', 400));
  const target = await User.findById(req.params.id);
  if (!target || !target.isActive) return next(new AppError('User not found.', 404));
  const isFollowing = target.followers.map(String).includes(req.user._id.toString());
  if (isFollowing) {
    await User.findByIdAndUpdate(target._id, { $pull: { followers: req.user._id }, $inc: { followersCount: -1 } });
    await User.findByIdAndUpdate(req.user._id, { $pull: { following: target._id }, $inc: { followingCount: -1 } });
    await Notification.deleteOne({ recipient: target._id, sender: req.user._id, type: 'follow' });
  } else {
    await User.findByIdAndUpdate(target._id, { $addToSet: { followers: req.user._id }, $inc: { followersCount: 1 } });
    await User.findByIdAndUpdate(req.user._id, { $addToSet: { following: target._id }, $inc: { followingCount: 1 } });
    if (target.notifications?.follows) {
      const notif = await Notification.create({ recipient: target._id, sender: req.user._id, type: 'follow', entityType: 'User', entityId: req.user._id, message: `${req.user.username} started following you.` });
      getSocketIO()?.to(`user:${target._id}`).emit('notification', notif);
    }
  }
  await deleteCache(`user:${target._id}`); await deleteCache(`user:${req.user._id}`);
  res.status(200).json({ success: true, data: { isFollowing: !isFollowing } });
});

export const getFollowers = asyncHandler(async (req, res, next) => {
  const page = +req.query.page || 1; const limit = +req.query.limit || 20;
  const user = await User.findOne({ username: req.params.username }).select('followers followersCount')
    .populate({ path: 'followers', select: 'username name avatar bio isVerified followersCount', options: { skip: (page-1)*limit, limit } });
  if (!user) return next(new AppError('User not found.', 404));
  res.status(200).json({ success: true, data: user.followers, meta: { total: user.followersCount, page, limit } });
});

export const getFollowing = asyncHandler(async (req, res, next) => {
  const page = +req.query.page || 1; const limit = +req.query.limit || 20;
  const user = await User.findOne({ username: req.params.username }).select('following followingCount')
    .populate({ path: 'following', select: 'username name avatar bio isVerified followersCount', options: { skip: (page-1)*limit, limit } });
  if (!user) return next(new AppError('User not found.', 404));
  res.status(200).json({ success: true, data: user.following, meta: { total: user.followingCount, page, limit } });
});

export const searchUsers = asyncHandler(async (req, res) => {
  const { q, page = 1, limit = 20 } = req.query;
  if (!q || q.trim().length < 2) return res.status(200).json({ success: true, data: [] });
  const regex = new RegExp(q.trim(), 'i');
  const users = await User.find({ isActive: true, $or: [{ username: regex }, { name: regex }], ...(req.user && { _id: { $ne: req.user._id } }) })
    .select('username name avatar bio isVerified followersCount')
    .sort({ followersCount: -1 }).skip((+page-1)*+limit).limit(+limit);
  res.status(200).json({ success: true, data: users });
});

export const getSuggestedUsers = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('following blockedUsers');
  const excluded = [req.user._id, ...user.following, ...user.blockedUsers];
  const suggested = await User.find({ _id: { $nin: excluded }, isActive: true })
    .select('username name avatar bio isVerified followersCount')
    .sort({ followersCount: -1 }).limit(10);
  res.status(200).json({ success: true, data: suggested });
});

export const toggleBlock = asyncHandler(async (req, res, next) => {
  if (req.params.id === req.user._id.toString()) return next(new AppError('Cannot block yourself.', 400));
  const target = await User.findById(req.params.id);
  if (!target) return next(new AppError('User not found.', 404));
  const isBlocked = req.user.blockedUsers?.map(String).includes(req.params.id);
  await User.findByIdAndUpdate(req.user._id, { [isBlocked ? '$pull' : '$addToSet']: { blockedUsers: req.params.id } });
  if (!isBlocked) {
    await User.findByIdAndUpdate(req.user._id, { $pull: { following: req.params.id } });
    await User.findByIdAndUpdate(req.params.id, { $pull: { followers: req.user._id, following: req.user._id } });
  }
  await deleteCache(`user:${req.user._id}`);
  res.status(200).json({ success: true, data: { isBlocked: !isBlocked } });
});

export const deactivateAccount = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(req.body.password))) return next(new AppError('Incorrect password.', 401));
  user.isActive = false; user.refreshTokens = [];
  await user.save({ validateBeforeSave: false });
  await deleteCache(`user:${req.user._id}`);
  res.clearCookie('refreshToken');
  res.status(200).json({ success: true, message: 'Account deactivated.' });
});
