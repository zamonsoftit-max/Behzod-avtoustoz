const rateLimit = require('express-rate-limit');

/**
 * Umumiy API limiter.
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Juda ko\'p so\'rov. Birozdan keyin urinib ko\'ring.' },
});

/**
 * Auth (login/register/sms) uchun qattiqroq limiter — brute-force'ga qarshi.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Juda ko\'p urinish. 15 daqiqadan keyin urinib ko\'ring.' },
});

module.exports = { apiLimiter, authLimiter };
