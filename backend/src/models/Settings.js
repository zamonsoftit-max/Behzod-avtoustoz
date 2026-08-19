const mongoose = require('mongoose');
const multiLang = require('./_multiLang');

const DEFAULT_PLANS = [
  {
    key: '1_month',
    name: {
      uz: '1 Oylik obuna',
      'uz-Cyrl': '1 Ойлик обуна',
      ru: '1 Месячная подписка',
    },
    price: 45000,
    durationDays: 30,
    type: 'premium',
    popular: false,
    isActive: true,
    features: [
      "Barcha 1000+ test savollariga to'liq kirish",
      "Mavzular bo'yicha cheksiz test topshirish",
      "Haqiqiy YPX imtihon simulyatori (20 ta savol, 25 daqiqa)",
      "Barcha savollarning to'liq tahlili va izohlari",
      "Natijalar va xatolar ustida ishlash statistikasi",
    ],
  },
  {
    key: '2_months',
    name: {
      uz: '2 Oylik obuna',
      'uz-Cyrl': '2 Ойлик обуна',
      ru: '2 Месячная подписка',
    },
    price: 75000,
    durationDays: 60,
    type: 'premium',
    popular: true,
    isActive: true,
    features: [
      "Barcha 1 oylik imkoniyatlar",
      "60 kun davomida to'liq cheksiz foydalanish",
      "Kengaytirilgan xatolar banki va takrorlash rejimi",
      "Tezkor biletlar va tasodifiy testlar",
      "15 000 so'm tejamkorlik",
      "24/7 texnik qo'llab-quvvatlash",
    ],
  },
  {
    key: '3_months',
    name: {
      uz: '3 Oylik obuna',
      'uz-Cyrl': '3 Ойлик обуна',
      ru: '3 Месячная подписка',
    },
    price: 125000,
    durationDays: 90,
    type: 'pro',
    popular: false,
    isActive: true,
    features: [
      "Barcha premium va pro imkoniyatlar",
      "90 kun davomida cheksiz to'liq tayyorgarlik",
      "Imtihondan 100% o'tish uchun to'liq kurs bazasi",
      "Har bir mavzu bo'yicha chuqurlashtirilgan tahlil",
      "Barcha yangilanadigan yangi savollarga avtomatik kirish",
      "VIP maqom va ustuvor qo'llab-quvvatlash",
    ],
  },
];

const planSchema = new mongoose.Schema(
  {
    key: { type: String, required: true }, // '1_month', '2_months', '3_months'
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

    subscriptionPlans: { type: [planSchema], default: () => DEFAULT_PLANS },

    maintenanceMode: { type: Boolean, default: false },
  },
  { timestamps: true }
);

/**
 * Singletonni olish yoki yaratish.
 */
settingsSchema.statics.getSingleton = async function getSingleton() {
  let doc = await this.findOne({ singleton: 'main' });
  if (!doc) {
    doc = await this.create({ singleton: 'main', subscriptionPlans: DEFAULT_PLANS });
  } else if (!doc.subscriptionPlans || doc.subscriptionPlans.length === 0 || !doc.subscriptionPlans.some(p => p.key === '2_months')) {
    doc.subscriptionPlans = DEFAULT_PLANS;
    await doc.save();
  }
  return doc;
};

settingsSchema.statics.DEFAULT_PLANS = DEFAULT_PLANS;

settingsSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Settings', settingsSchema);
