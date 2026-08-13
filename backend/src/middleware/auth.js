const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const tokenService = require('../services/token.service');

/**
 * Tokenni cookie yoki Authorization sarlavhasidan oladi.
 */
function extractToken(req) {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) return auth.slice(7);
  if (req.cookies && req.cookies.token) return req.cookies.token;
  return null;
}

/**
 * Himoyalangan route'lar uchun: tokenni tekshirib, req.user ni o'rnatadi.
 */
const protect = asyncHandler(async (req, res, next) => {
  const token = extractToken(req);
  if (!token) throw ApiError.unauthorized('Tizimga kirish talab qilinadi');

  let decoded;
  try {
    decoded = tokenService.verifyAccessToken(token);
  } catch (err) {
    throw ApiError.unauthorized('Token yaroqsiz yoki muddati tugagan');
  }

  const user = await User.findById(decoded.id);
  if (!user) throw ApiError.unauthorized('Foydalanuvchi topilmadi');
  if (user.status === 'blocked') throw ApiError.forbidden('Hisobingiz bloklangan');

  // Bitta qurilma siyosati: token ichidagi sid joriy aktiv sessiya bilan mos kelishi kerak.
  if (user.activeSessionId && decoded.sid && decoded.sid !== user.activeSessionId) {
    throw ApiError.unauthorized('Boshqa qurilmadan kirildi', { sessionExpired: true });
  }

  req.user = user;
  req.sessionId = decoded.sid;
  next();
});

/**
 * Rol bo'yicha ruxsat: authorize('admin')
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(ApiError.forbidden('Bu amal uchun ruxsatingiz yo\'q'));
    }
    next();
  };
}

/**
 * Faol obuna talab qiladigan route'lar uchun.
 */
function requireSubscription(req, res, next) {
  if (req.user && (req.user.role === 'admin' || req.user.hasActiveSubscription())) {
    return next();
  }
  return next(
    ApiError.forbidden('Bu bo\'lim uchun faol obuna talab qilinadi', { subscriptionRequired: true })
  );
}

module.exports = { protect, authorize, requireSubscription };
