import { Message, Conversation } from '../models/Message.js';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { getSocketIO } from '../socket/socket.js';

export const getOrCreateConversation = asyncHandler(async (req, res, next) => {
  if (req.params.userId === req.user._id.toString()) return next(new AppError('Cannot DM yourself.', 400));
  const other = await User.findById(req.params.userId).select('username name avatar isActive');
  if (!other?.isActive) return next(new AppError('User not found.', 404));
  let conv = await Conversation.findOne({ type: 'direct', 'participants.user': { $all: [req.user._id, req.params.userId] }, $expr: { $eq: [{ $size: '$participants' }, 2] } })
    .populate('participants.user', 'username name avatar onlineStatus lastSeen');
  if (!conv) {
    conv = await Conversation.create({ type: 'direct', participants: [{ user: req.user._id }, { user: req.params.userId }] });
    await conv.populate('participants.user', 'username name avatar onlineStatus lastSeen');
  }
  res.status(200).json({ success: true, data: conv });
});

export const getConversations = asyncHandler(async (req, res) => {
  const page = +req.query.page || 1; const limit = 20;
  const convs = await Conversation.find({ 'participants.user': req.user._id, isActive: true })
    .sort({ lastActivity: -1 }).skip((page-1)*limit).limit(limit)
    .populate('participants.user', 'username name avatar onlineStatus lastSeen isVerified')
    .populate({ path: 'lastMessage', select: 'content type sender createdAt isDeleted', populate: { path: 'sender', select: 'username' } })
    .lean();
  const enriched = await Promise.all(convs.map(async (c) => {
    const unreadCount = await Message.countDocuments({ conversation: c._id, sender: { $ne: req.user._id }, 'seenBy.user': { $ne: req.user._id }, isDeleted: false });
    return { ...c, unreadCount };
  }));
  res.status(200).json({ success: true, data: enriched });
});

export const getMessages = asyncHandler(async (req, res, next) => {
  const { conversationId } = req.params;
  const page = +req.query.page || 1; const limit = 50;
  const conv = await Conversation.findOne({ _id: conversationId, 'participants.user': req.user._id });
  if (!conv) return next(new AppError('Conversation not found.', 404));
  const messages = await Message.find({ conversation: conversationId, isDeleted: false, deletedFor: { $ne: req.user._id } })
    .sort({ createdAt: -1 }).skip((page-1)*limit).limit(limit)
    .populate('sender', 'username name avatar isVerified')
    .populate('replyTo', 'content sender type').lean();
  await Message.updateMany({ conversation: conversationId, sender: { $ne: req.user._id }, 'seenBy.user': { $ne: req.user._id } }, { $addToSet: { seenBy: { user: req.user._id, seenAt: new Date() } } });
  await Conversation.updateOne({ _id: conversationId, 'participants.user': req.user._id }, { $set: { 'participants.$.lastRead': new Date() } });
  getSocketIO()?.to(`conversation:${conversationId}`).emit('messages_seen', { conversationId, userId: req.user._id, seenAt: new Date() });
  res.status(200).json({ success: true, data: messages.reverse(), meta: { page, limit, hasMore: messages.length === limit } });
});

export const sendMessage = asyncHandler(async (req, res, next) => {
  const { conversationId } = req.params;
  const { content, type = 'text', replyTo } = req.body;
  const conv = await Conversation.findOne({ _id: conversationId, 'participants.user': req.user._id, isActive: true })
    .populate('participants.user', '_id username notifications');
  if (!conv) return next(new AppError('Conversation not found.', 404));
  const media = req.file ? { url: req.file.path, publicId: req.file.filename, type: req.file.mimetype, size: req.file.size, name: req.file.originalname } : undefined;
  const msg = await Message.create({ conversation: conversationId, sender: req.user._id, content, type, media, replyTo: replyTo || undefined });
  await Conversation.findByIdAndUpdate(conversationId, { lastMessage: msg._id, lastActivity: new Date(), $inc: { messagesCount: 1 } });
  await msg.populate('sender', 'username name avatar isVerified');
  if (replyTo) await msg.populate('replyTo', 'content sender type');
  const io = getSocketIO();
  io?.to(`conversation:${conversationId}`).emit('new_message', msg);
  conv.participants.forEach((p) => {
    if (p.user._id.toString() !== req.user._id.toString())
      io?.to(`user:${p.user._id}`).emit('message_notification', { conversationId, message: msg });
  });
  res.status(201).json({ success: true, data: msg });
});

export const deleteMessage = asyncHandler(async (req, res, next) => {
  const msg = await Message.findById(req.params.messageId);
  if (!msg) return next(new AppError('Message not found.', 404));
  if (msg.sender.toString() !== req.user._id.toString()) return next(new AppError('Not authorized.', 403));
  const hoursOld = (Date.now() - msg.createdAt) / (1000 * 60 * 60);
  if (hoursOld > 24) { msg.deletedFor.push(req.user._id); }
  else { msg.isDeleted = true; msg.content = undefined; msg.media = undefined;
    getSocketIO()?.to(`conversation:${msg.conversation}`).emit('message_deleted', { messageId: msg._id, conversationId: msg.conversation }); }
  await msg.save();
  res.status(200).json({ success: true, message: 'Message deleted.' });
});

export const createGroupChat = asyncHandler(async (req, res, next) => {
  const { name, description, participantIds } = req.body;
  if (!participantIds || participantIds.length < 2) return next(new AppError('Need at least 2 participants.', 400));
  const conv = await Conversation.create({ type: 'group', name, description, participants: [{ user: req.user._id, role: 'admin' }, ...participantIds.map((id) => ({ user: id }))] });
  await conv.populate('participants.user', 'username name avatar');
  res.status(201).json({ success: true, data: conv });
});
