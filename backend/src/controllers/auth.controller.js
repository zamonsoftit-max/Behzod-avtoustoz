const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/response');
const tokenService = require('../services/token.service');
const smsService = require('../services/sms.service');
const socket = require('../socket');

/**
 * Telefon raqamini normallashtirish: faqat raqamlar, 998 prefiks bilan.
 */
function normalizePhone(phone) {
  let p = String(phone || '').replace(/\D/g, '');
  if (p.startsWith('998')) return p;
  if (p.length === 9) return `998${p}`;
  return p;
}

/**
 * Login muvaffaqiyatli bo'lganda token + cookie o'rnatib, javob qaytaradi.
 */
async function issueSession(res, user) {
  const sessionId = uuidv4();
  user.activeSessionId = sessionId;
  user.lastLoginAt = new Date();
  await user.save();

  const accessToken = tokenService.signAccessToken(user, sessionId);
  const refreshToken = tokenService.signRefreshToken(user, sessionId);
  tokenService.setRefreshCookie(res, refreshToken);
  tokenService.setSessionCookie(res, sessionId);

  return { accessToken, sessionId };
}

// POST /auth/register
exports.register = asyncHandler(async (req, res) => {
  const { firstName, lastName, password } = req.body;
  const phoneNumber = normalizePhone(req.body.phoneNumber);

  if (!phoneNumber || phoneNumber.length !== 12) {
    throw ApiError.badRequest('Telefon raqami noto\'g\'ri formatda');
  }
  if (!password || password.length < 6) {
    throw ApiError.badRequest('Parol kamida 6 ta belgidan iborat bo\'lishi kerak');
  }

  const exists = await User.findOne({ phoneNumber });
  if (exists) throw ApiError.badRequest('Bu telefon raqami allaqachon ro\'yxatdan o\'tgan');

  const user = await User.create({
    firstName: firstName || '',
    lastName: lastName || '',
    phoneNumber,
    password,
    language: req.lang,
  });

  // Telefon tasdiqlash kodi (ixtiyoriy oqim — SMS dev rejimda konsolga chiqadi)
  const code = smsService.generateCode();
  user.verification = { code, expiresAt: new Date(Date.now() + 5 * 60 * 1000), attempts: 0, purpose: 'registration' };
  await user.save();
  const smsResult = await smsService.sendVerificationCode(phoneNumber, code, req.lang);
  if (!smsResult.ok) {
    await User.deleteOne({ _id: user._id });
    throw ApiError.serviceUnavailable('SMS kodi yuborilmadi. Iltimos, birozdan keyin qayta urinib ko\'ring.');
  }

  return res.status(201).json({
    success: true,
    message: 'SMS tasdiqlash kodi yuborildi',
    requiresSms: true,
    verificationPurpose: 'registration',
    phoneNumber,
    user: user.toJSON(),
  });
});

// POST /auth/resend-registration-code { phoneNumber }
exports.resendRegistrationCode = asyncHandler(async (req, res) => {
  const phoneNumber = normalizePhone(req.body.phoneNumber);
  const user = await User.findOne({ phoneNumber });
  if (!user) throw ApiError.notFound('Foydalanuvchi topilmadi');

  const code = smsService.generateCode();
  user.verification = { code, expiresAt: new Date(Date.now() + 5 * 60 * 1000), attempts: 0, purpose: 'registration' };
  await user.save();
  const smsResult = await smsService.sendVerificationCode(phoneNumber, code, user.language);
  if (!smsResult.ok) {
    throw ApiError.serviceUnavailable('SMS kodi yuborilmadi. Iltimos, birozdan keyin qayta urinib ko\'ring.');
  }
  return ok(res, { requiresSms: true, phoneNumber }, 'SMS kodi qayta yuborildi');
});

// POST /auth/verify-registration { phoneNumber, code }
exports.verifyRegistration = asyncHandler(async (req, res) => {
  const phoneNumber = normalizePhone(req.body.phoneNumber);
  const { code } = req.body;
  const user = await User.findOne({ phoneNumber }).select('+verification.code +verification.expiresAt +verification.attempts +verification.purpose');
  if (!user) throw ApiError.notFound('Foydalanuvchi topilmadi');
  const v = user.verification || {};
  if (v.purpose !== 'registration' || !v.code || !v.expiresAt || new Date(v.expiresAt) < new Date()) {
    throw ApiError.badRequest('SMS kodi muddati tugagan. Qayta yuboring.');
  }
  if (String(code) !== String(v.code)) {
    user.verification.attempts = (v.attempts || 0) + 1;
    await user.save();
    throw ApiError.badRequest('SMS tasdiqlash kodi noto\'g\'ri');
  }

  user.isVerified = true;
  user.verification = { code: undefined, expiresAt: undefined, attempts: 0, purpose: undefined };
  const { accessToken } = await issueSession(res, user);
  return res.json({ success: true, message: 'Telefon raqami tasdiqlandi', token: accessToken, user: user.toJSON() });
});

// POST /auth/login
exports.login = asyncHandler(async (req, res) => {
  const phoneNumber = normalizePhone(req.body.phoneNumber || req.body.phone);
  const { password } = req.body;

  const user = await User.findOne({ phoneNumber }).select('+password');
  if (!user) throw ApiError.badRequest('Telefon raqami yoki parol noto\'g\'ri');
  if (user.status === 'blocked') throw ApiError.forbidden('Hisobingiz bloklangan');

  const match = await user.comparePassword(password || '');
  if (!match) throw ApiError.badRequest('Telefon raqami yoki parol noto\'g\'ri');

  // Har bir login uchun yangi SMS tasdiqlash talab qilinadi.
  const code = smsService.generateCode();
  user.verification = { code, expiresAt: new Date(Date.now() + 5 * 60 * 1000), attempts: 0, purpose: 'login' };
  await user.save();
  const smsResult = await smsService.sendVerificationCode(phoneNumber, code, user.language);
  if (!smsResult.ok) {
    throw ApiError.serviceUnavailable('SMS kodi yuborilmadi. Iltimos, birozdan keyin qayta urinib ko\'ring.');
  }

  return res.json({
    success: true,
    message: 'SMS tasdiqlash kodi yuborildi',
    requiresSms: true,
    verificationPurpose: 'login',
    phoneNumber,
  });
});

// POST /auth/verify-login { phoneNumber, code }
exports.verifyLogin = asyncHandler(async (req, res) => {
  const phoneNumber = normalizePhone(req.body.phoneNumber);
  const { code } = req.body;
  const user = await User.findOne({ phoneNumber }).select('+verification.code +verification.expiresAt +verification.attempts +verification.purpose');
  if (!user) throw ApiError.notFound('Foydalanuvchi topilmadi');

  const v = user.verification || {};
  if (v.purpose !== 'login' || !v.code || !v.expiresAt || new Date(v.expiresAt) < new Date()) {
    throw ApiError.badRequest('Login SMS kodi muddati tugagan. Qayta login qiling.');
  }
  if (String(code) !== String(v.code)) {
    user.verification.attempts = (v.attempts || 0) + 1;
    await user.save();
    throw ApiError.badRequest('SMS tasdiqlash kodi noto\'g\'ri');
  }

  user.verification = { code: undefined, expiresAt: undefined, attempts: 0, purpose: undefined };
  if (user.activeSessionId) socket.forceLogout(user._id);
  const { accessToken } = await issueSession(res, user);
  return res.json({ success: true, message: 'Tizimga muvaffaqiyatli kirdingiz', token: accessToken, user: user.toJSON() });
});

// POST /auth/logout
exports.logout = asyncHandler(async (req, res) => {
  if (req.user) {
    req.user.activeSessionId = null;
    req.user.isOnline = false;
    await req.user.save();
  }
  tokenService.clearAuthCookies(res);
  return ok(res, null, 'Tizimdan chiqdingiz');
});

// GET /auth/me
exports.me = asyncHandler(async (req, res) => {
  return ok(res, req.user.toJSON());
});

// POST /auth/refresh
exports.refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) throw ApiError.unauthorized('Refresh token topilmadi');

  let decoded;
  try {
    decoded = tokenService.verifyRefreshToken(token);
  } catch (err) {
    throw ApiError.unauthorized('Refresh token yaroqsiz');
  }

  const user = await User.findById(decoded.id);
  if (!user) throw ApiError.unauthorized('Foydalanuvchi topilmadi');
  if (user.status === 'blocked') throw ApiError.forbidden('Hisobingiz bloklangan');
  if (user.activeSessionId && decoded.sid !== user.activeSessionId) {
    throw ApiError.unauthorized('Sessiya yaroqsiz', { sessionExpired: true });
  }

  const accessToken = tokenService.signAccessToken(user, decoded.sid);
  return res.json({ success: true, token: accessToken });
});

// POST /auth/verify-code  { phoneNumber, code }
exports.verifyCode = asyncHandler(async (req, res) => {
  const phoneNumber = normalizePhone(req.body.phoneNumber);
  const { code } = req.body;

  const user = await User.findOne({ phoneNumber }).select('+verification.code +verification.expiresAt +verification.attempts');
  if (!user) throw ApiError.notFound('Foydalanuvchi topilmadi');

  const v = user.verification || {};
  if (!v.code || !v.expiresAt || new Date(v.expiresAt) < new Date()) {
    throw ApiError.badRequest('Kod muddati tugagan. Qayta so\'rang.');
  }
  if (String(code) !== String(v.code)) {
    user.verification.attempts = (v.attempts || 0) + 1;
    await user.save();
    throw ApiError.badRequest('Tasdiqlash kodi noto\'g\'ri');
  }

  user.isVerified = true;
  user.verification = { code: undefined, expiresAt: undefined, attempts: 0, purpose: undefined };
  await user.save();

  return ok(res, { isVerified: true }, 'Telefon raqami tasdiqlandi');
});

// POST /auth/forgot-password  { phoneNumber }
exports.forgotPassword = asyncHandler(async (req, res) => {
  const phoneNumber = normalizePhone(req.body.phoneNumber);
  const user = await User.findOne({ phoneNumber });

  // Ma'lumot oshkor qilmaslik uchun har doim muvaffaqiyat qaytaramiz
  if (user) {
    const code = smsService.generateCode();
    user.verification = { code, expiresAt: new Date(Date.now() + 5 * 60 * 1000), attempts: 0, purpose: 'password_reset' };
    await user.save();
    smsService.sendVerificationCode(phoneNumber, code, req.lang).catch(() => {});
  }

  return ok(res, null, 'Agar raqam ro\'yxatdan o\'tgan bo\'lsa, tasdiqlash kodi yuborildi');
});

// POST /auth/reset-password  { phoneNumber, code, newPassword }
exports.resetPassword = asyncHandler(async (req, res) => {
  const phoneNumber = normalizePhone(req.body.phoneNumber);
  const { code, newPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    throw ApiError.badRequest('Yangi parol kamida 6 ta belgidan iborat bo\'lishi kerak');
  }

  const user = await User.findOne({ phoneNumber }).select('+verification.code +verification.expiresAt');
  if (!user) throw ApiError.notFound('Foydalanuvchi topilmadi');

  const v = user.verification || {};
  if (!v.code || new Date(v.expiresAt) < new Date() || String(code) !== String(v.code)) {
    throw ApiError.badRequest('Tasdiqlash kodi noto\'g\'ri yoki muddati tugagan');
  }

  user.password = newPassword;
  user.verification = { code: undefined, expiresAt: undefined, attempts: 0 };
  user.activeSessionId = null; // barcha sessiyalarni bekor qilish
  await user.save();

  return ok(res, null, 'Parol muvaffaqiyatli yangilandi');
});

// PUT /auth/update-password  { currentPassword, newPassword }
exports.updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) {
    throw ApiError.badRequest('Yangi parol kamida 6 ta belgidan iborat bo\'lishi kerak');
  }

  const user = await User.findById(req.user._id).select('+password');
  const match = await user.comparePassword(currentPassword || '');
  if (!match) throw ApiError.badRequest('Joriy parol noto\'g\'ri');

  user.password = newPassword;
  await user.save();

  return ok(res, null, 'Parol muvaffaqiyatli yangilandi');
});
