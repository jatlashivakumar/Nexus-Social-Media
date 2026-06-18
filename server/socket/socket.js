import { Server } from 'socket.io';
import { verifyAccessToken } from '../utils/generateToken.js';
import User from '../models/User.js';
import { Message, Conversation } from '../models/Message.js';
import logger from '../utils/logger.js';

let io = null;
const onlineUsers = new Map();

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: { origin: process.env.CLIENT_URL, credentials: true },
    pingTimeout: 60000, pingInterval: 25000,
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
      if (!token) return next(new Error('Authentication required'));
      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.id).select('username name avatar isActive');
      if (!user?.isActive) return next(new Error('User not found'));
      socket.user = user;
      next();
    } catch { next(new Error('Invalid token')); }
  });

  io.on('connection', async (socket) => {
    const uid = socket.user._id.toString();
    logger.info(`Socket connected: ${socket.user.username}`);

    socket.join(`user:${uid}`);
    if (!onlineUsers.has(uid)) onlineUsers.set(uid, new Set());
    onlineUsers.get(uid).add(socket.id);
    await User.findByIdAndUpdate(uid, { onlineStatus: 'online', lastSeen: new Date() });
    io.emit('user_online', { userId: uid });

    const convs = await Conversation.find({ 'participants.user': uid, isActive: true }).select('_id');
    convs.forEach((c) => socket.join(`conversation:${c._id}`));

    socket.on('typing_start', ({ conversationId }) =>
      socket.to(`conversation:${conversationId}`).emit('typing_start', { conversationId, userId: uid, username: socket.user.username }));
    socket.on('typing_stop',  ({ conversationId }) =>
      socket.to(`conversation:${conversationId}`).emit('typing_stop',  { conversationId, userId: uid }));
    socket.on('join_conversation',  (id) => socket.join(`conversation:${id}`));
    socket.on('leave_conversation', (id) => socket.leave(`conversation:${id}`));

    socket.on('react_message', async ({ messageId, emoji }) => {
      try {
        const msg = await Message.findById(messageId);
        if (!msg) return;
        const idx = msg.reactions.findIndex((r) => r.user.toString() === uid);
        if (idx > -1) { if (msg.reactions[idx].emoji === emoji) msg.reactions.splice(idx, 1); else msg.reactions[idx].emoji = emoji; }
        else msg.reactions.push({ user: uid, emoji });
        await msg.save();
        io.to(`conversation:${msg.conversation}`).emit('message_reaction', { messageId, reactions: msg.reactions });
      } catch { socket.emit('error', { message: 'React failed' }); }
    });

    socket.on('disconnect', async () => {
      const sockets = onlineUsers.get(uid);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          onlineUsers.delete(uid);
          await User.findByIdAndUpdate(uid, { onlineStatus: 'offline', lastSeen: new Date() });
          io.emit('user_offline', { userId: uid, lastSeen: new Date() });
        }
      }
    });
  });

  logger.info('✅ Socket.IO initialized');
  return io;
};

export const getSocketIO    = () => io;
export const isUserOnline   = (uid) => onlineUsers.has(uid.toString());
export const getOnlineUsers = () => [...onlineUsers.keys()];
