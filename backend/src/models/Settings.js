const mongoose = require('mongoose');
const multiLang = require('./_multiLang');

const planSchema = new mongoose.Schema(
  {
    key: { type: String, required: true }, // 'monthly', 'quarterly', 'yearly'
    name: multiLang(),
    price: { type: Number, required: true }, // UZS
    durationDays: { type: Number, required: true },
    type: { type: String, enum: ['free', 'premium', 'pro'], default: 'premium' },
    features: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
    popular: { type: Boolean, default: false },
  },
  { _id: false }
);

/**
 * Yagona (singleton) sozlamalar hujjati.
 */
const settingsSchema = new mongoose.Schema(
  {
    singleton: { type: String, default: 'main', unique: true },

    siteName: { type: String, default: 'Behzod Avtoustoz' },
    contactInfo: {
      phone: { type: String, default: '' },
      email: { type: String, default: '' },
      telegram: { type: String, default: '' },
      address: { type: String, default: '' },
    },

    examSettings: {
      questionCount: { type: Number, default: 20 },
      durationMinutes: { type: Number, default: 25 },
      passingScore: { type: Number, default: 18 }, // to'g'ri javoblar soni
      maxMistakes: { type: Number, default: 2 },
    },

    demoSettings: {
      questionCount: { type: Number, default: 10 },
    },

    subscriptionPlans: { type: [planSchema], default: [] },

    maintenanceMode: { type: Boolean, default: false },
  },
  { timestamps: true }
);

/**
 * Singletonni olish yoki yaratish.
 */
settingsSchema.statics.getSingleton = async function getSingleton() {
  let doc = await this.findOne({ singleton: 'main' });
  if (!doc) doc = await this.create({ singleton: 'main' });
  return doc;
};

settingsSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Settings', settingsSchema);
