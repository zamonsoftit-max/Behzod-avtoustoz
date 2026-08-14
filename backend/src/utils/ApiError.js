/**
 * HTTP status kodi bilan boshqariladigan xato.
 * throw new ApiError(404, 'Topilmadi')
 */
class ApiError extends Error {
  constructor(statusCode, message, extra = {}) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Object.assign(this, extra); // masalan { subscriptionRequired: true }
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(msg, extra) { return new ApiError(400, msg, extra); }
  static unauthorized(msg = 'Avtorizatsiya talab qilinadi', extra) { return new ApiError(401, msg, extra); }
  static forbidden(msg = 'Ruxsat yo\'q', extra) { return new ApiError(403, msg, extra); }
  static notFound(msg = 'Ma\'lumot topilmadi', extra) { return new ApiError(404, msg, extra); }
  static tooMany(msg = 'Juda ko\'p urinish', extra) { return new ApiError(429, msg, extra); }
  static serviceUnavailable(msg = 'Xizmat vaqtincha ishlamayapti', extra) { return new ApiError(503, msg, extra); }
  static server(msg = 'Server xatosi', extra) { return new ApiError(500, msg, extra); }
}

module.exports = ApiError;
