const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    plan: { type: String, required: true }, // narx rejasi kaliti (Settings.subscriptionPlans[].key)
    subscriptionType: { type: String, default: '' }, // ko'rsatish uchun nom
    amount: { type: Number, required: true }, // UZS so'm
    durationDays: { type: Number, default: 30 },

    paymentMethod: { type: String, enum: ['click', 'payme', 'manual'], required: true, index: true },
    status: {
      type: String,
      enum: ['pending', 'paid', 'completed', 'cancelled', 'failed', 'refunded'],
      default: 'pending',
      index: true,
    },

    // Provayder ma'lumotlari
    transactionId: { type: String, default: null, index: true }, // bizning ichki ID (provayderga uzatiladi)
    providerTransId: { type: String, default: null }, // Click/Payme tranzaksiya ID
    providerState: { type: Number, default: 0 }, // Payme state mashinasi uchun
    paymentUrl: { type: String, default: '' },

    paidAt: { type: Date },
    cancelledAt: { type: Date },
    cancelReason: { type: Number, default: null }, // Payme cancel reason kodi

    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

paymentSchema.index({ user: 1, createdAt: -1 });

paymentSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Payment', paymentSchema);
