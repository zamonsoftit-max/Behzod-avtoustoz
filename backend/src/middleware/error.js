const env = require('../config/env');
const ApiError = require('../utils/ApiError');

/**
 * 404 — topilmagan route.
 */
function notFound(req, res, next) {
  next(new ApiError(404, `Route topilmadi: ${req.method} ${req.originalUrl}`));
}

/**
 * Markaziy xato boshqaruvchisi. Frontend response.data.message va .errors ni o'qiydi.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Server xatosi';
  const extra = {};

  // Mongoose: noto'g'ri ObjectId
  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Noto\'g\'ri ID format';
  }

  // Mongoose: validatsiya
  if (err.name === 'ValidationError') {
    statusCode = 400;
    extra.errors = Object.values(err.errors).map((e) => ({ path: e.path, msg: e.message }));
    message = 'Ma\'lumotlar noto\'g\'ri';
  }

  // Mongo: takrorlanuvchi kalit (masalan telefon raqami)
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue || {})[0] || 'qiymat';
    message = `Bu ${field} allaqachon ro'yxatdan o'tgan`;
  }

  // ApiError ga biriktirilgan qo'shimcha bayroqlar (subscriptionRequired, sessionExpired, ...)
  ['subscriptionRequired', 'sessionExpired', 'blockMessage'].forEach((k) => {
    if (err[k] !== undefined) extra[k] = err[k];
  });

  if (statusCode >= 500) {
    console.error('💥 Server xatosi:', err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...extra,
    ...(env.isProd ? {} : { stack: err.stack }),
  });
}

module.exports = { notFound, errorHandler };
