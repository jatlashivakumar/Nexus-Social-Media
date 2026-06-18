import Notification from '../models/Notification.js';
import asyncHandler from '../utils/asyncHandler.js';

export const getNotifications = asyncHandler(async (req, res) => {
  const page = +req.query.page || 1; const limit = 20;
  const notifications = await Notification.find({ recipient: req.user._id })
    .sort({ createdAt: -1 }).skip((page-1)*limit).limit(limit)
    .populate('sender', 'username name avatar isVerified').lean();
  const unreadCount = await Notification.countDocuments({ recipient: req.user._id, isRead: false });
  res.status(200).json({ success: true, data: notifications, unreadCount, meta: { page, limit } });
});

export const markAsRead = asyncHandler(async (req, res) => {
  const filter = { recipient: req.user._id, isRead: false };
  if (req.body.notificationIds) filter._id = { $in: req.body.notificationIds };
  await Notification.updateMany(filter, { isRead: true, readAt: new Date() });
  res.status(200).json({ success: true, message: 'Marked as read.' });
});

export const deleteNotification = asyncHandler(async (req, res) => {
  await Notification.findOneAndDelete({ _id: req.params.id, recipient: req.user._id });
  res.status(200).json({ success: true, message: 'Deleted.' });
});

export const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({ recipient: req.user._id, isRead: false });
  res.status(200).json({ success: true, data: { count } });
});
