const Payment = require('../models/Payment');
const User = require('../models/User');
const Settings = require('../models/Settings');
const notify = require('./notification.service');

/**
 * To'lov muvaffaqiyatli bo'lganda foydalanuvchi obunasini faollashtiradi.
 * Idempotent: allaqachon completed bo'lsa qayta uzaytirmaydi.
 */
async function activateSubscription(payment) {
  if (payment.status === 'completed' && payment.paidAt) return payment;

  const user = await User.findById(payment.user);
  if (!user) return payment;

  const now = new Date();
  const base = user.hasActiveSubscription() ? new Date(user.subscription.endDate) : now;
  const end = new Date(base.getTime() + (payment.durationDays || 30) * 24 * 60 * 60 * 1000);

  const settings = await Settings.getSingleton();
  const plan = settings.subscriptionPlans.find((p) => p.key === payment.plan);

  user.subscription = {
    type: plan?.type || 'premium',
    plan: payment.plan,
    startDate: user.hasActiveSubscription() ? user.subscription.startDate : now,
    endDate: end,
    isActive: true,
  };
  await user.save();

  payment.status = 'completed';
  payment.paidAt = now;
  await payment.save();

  notify
    .notifyUser(user._id, {
      title: 'To\'lov muvaffaqiyatli',
      message: `Obunangiz ${end.toLocaleDateString('uz-UZ')} gacha faollashtirildi.`,
      type: 'payment',
      priority: 'medium',
    })
    .catch(() => {});

  return payment;
}

/**
 * Muddati o'tgan obunalarni nofaol qiladi (cron orqali chaqiriladi).
 */
async function deactivateExpired() {
  const now = new Date();
  const res = await User.updateMany(
    { 'subscription.isActive': true, 'subscription.endDate': { $lte: now } },
    { $set: { 'subscription.isActive': false } }
  );
  return res.modifiedCount || 0;
}

module.exports = { activateSubscription, deactivateExpired };
