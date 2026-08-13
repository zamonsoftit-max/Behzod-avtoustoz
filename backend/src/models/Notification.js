const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, default: '' },
    message: { type: String, default: '' },
    type: {
      type: String,
      enum: ['info', 'success', 'warning', 'error', 'payment', 'subscription', 'system', 'test'],
      default: 'info',
    },
    priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'low' },
    isRead: { type: Boolean, default: false, index: true },
    readAt: { type: Date },
    link: { type: String, default: '' },
    // Admin tomonidan ommaviy yuborilgan partiyani belgilash uchun
    batchId: { type: String, default: null },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, createdAt: -1 });

notificationSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Notification', notificationSchema);
