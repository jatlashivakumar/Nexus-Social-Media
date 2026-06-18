import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
  sender:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content:      { type: String, maxlength: 5000 },
  type:         { type: String, enum: ['text','image','video','audio','file','system'], default: 'text' },
  media:        { url: String, publicId: String, type: String, size: Number, name: String },
  replyTo:      { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  reactions:    [{ user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, emoji: String }],
  seenBy:       [{ user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, seenAt: { type: Date, default: Date.now } }],
  isDeleted:    { type: Boolean, default: false },
  deletedFor:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

messageSchema.index({ conversation: 1, createdAt: -1 });

const conversationSchema = new mongoose.Schema({
  participants: [{
    user:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role:       { type: String, enum: ['member','admin'], default: 'member' },
    lastRead:   { type: Date, default: Date.now },
    isMuted:    { type: Boolean, default: false },
    isArchived: { type: Boolean, default: false },
  }],
  type:         { type: String, enum: ['direct','group'], default: 'direct' },
  name:         String,
  avatar:       { url: String, publicId: String },
  lastMessage:  { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  lastActivity: { type: Date, default: Date.now },
  messagesCount:{ type: Number, default: 0 },
  isActive:     { type: Boolean, default: true },
}, { timestamps: true });

conversationSchema.index({ 'participants.user': 1 });
conversationSchema.index({ lastActivity: -1 });

export const Message      = mongoose.model('Message',      messageSchema);
export const Conversation = mongoose.model('Conversation', conversationSchema);
