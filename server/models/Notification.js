import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sender:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type:      { type: String, required: true,
    enum: ['follow','follow_request','like','comment','comment_like','reply','mention','repost','message','system'] },
  entityType:{ type: String, enum: ['Post','Comment','Message','User'] },
  entityId:  { type: mongoose.Schema.Types.ObjectId, refPath: 'entityType' },
  message:   { type: String, maxlength: 200 },
  isRead:    { type: Boolean, default: false },
  readAt:    Date,
}, { timestamps: true });

notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

export default mongoose.model('Notification', notificationSchema);
