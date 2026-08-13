const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const subscriptionSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['free', 'premium', 'pro'], default: 'free' },
    plan: { type: String, default: 'free' }, // narx rejasining kaliti (Settings dagi)
    startDate: { type: Date },
    endDate: { type: Date },
    isActive: { type: Boolean, default: false },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, trim: true, default: '' },
    lastName: { type: String, trim: true, default: '' },
    phoneNumber: {
      type: String,
      required: [true, 'Telefon raqami majburiy'],
      unique: true,
      trim: true,
      index: true,
    },
    password: { type: String, required: true, select: false, minlength: 6 },
    role: { type: String, enum: ['student', 'admin'], default: 'student', index: true },

    language: { type: String, enum: ['uz', 'uz-Cyrl', 'ru'], default: 'uz' },
    theme: { type: String, enum: ['light', 'dark'], default: 'light' },
    avatar: { type: String, default: '' },

    isVerified: { type: Boolean, default: false }, // telefon tasdiqlangan
    status: { type: String, enum: ['active', 'blocked'], default: 'active', index: true },

    subscription: { type: subscriptionSchema, default: () => ({}) },

    // Bitta qurilma siyosati uchun joriy aktiv sessiya
    activeSessionId: { type: String, default: null },
    socketId: { type: String, default: null },
    isOnline: { type: Boolean, default: false },
    lastSeenAt: { type: Date },
    lastLoginAt: { type: Date },

    // Telefon tasdiqlash kodi (SMS)
    verification: {
      code: { type: String, select: false },
      expiresAt: { type: Date, select: false },
      attempts: { type: Number, default: 0, select: false },
      purpose: { type: String, enum: ['registration', 'login', 'password_reset'], select: false },
    },

    notificationPreferences: {
      push: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      testReminders: { type: Boolean, default: true },
      subscriptionAlerts: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

// Parolni hash qilish
userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Obuna haqiqatda faolmi (muddati o'tmaganmi)
userSchema.methods.hasActiveSubscription = function hasActiveSubscription() {
  const s = this.subscription;
  if (!s || !s.isActive || !s.endDate) return false;
  return new Date(s.endDate).getTime() > Date.now();
};

userSchema.virtual('fullName').get(function fullName() {
  return `${this.firstName || ''} ${this.lastName || ''}`.trim();
});

// Maxfiy maydonlarni JSON dan olib tashlash
userSchema.set('toJSON', {
  virtuals: true,
  transform(doc, ret) {
    delete ret.password;
    delete ret.verification;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('User', userSchema);
