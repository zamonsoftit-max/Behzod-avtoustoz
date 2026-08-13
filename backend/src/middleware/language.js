const { resolveLang } = require('../utils/i18n');

/**
 * Accept-Language sarlavhasidan req.lang ni o'rnatadi (uz | uz-Cyrl | ru).
 */
function language(req, res, next) {
  req.lang = resolveLang(req.headers['accept-language']);
  next();
}

module.exports = language;
