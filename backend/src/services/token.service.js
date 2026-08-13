const jwt = require('jsonwebtoken');
const env = require('../config/env');

function signAccessToken(user, sessionId) {
  return jwt.sign(
    { id: user._id.toString(), role: user.role, sid: sessionId },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );
}

function signRefreshToken(user, sessionId) {
  return jwt.sign(
    { id: user._id.toString(), sid: sessionId },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRES_IN }
  );
}

function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT_SECRET);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, env.JWT_REFRESH_SECRET);
}

/**
 * Refresh tokenni httpOnly cookie sifatida o'rnatish.
 */
function setRefreshCookie(res, token) {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: env.isProd,
    sameSite: env.isProd ? 'none' : 'lax',
    domain: env.COOKIE_DOMAIN,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 kun
    path: '/',
  });
}

/**
 * sessionId cookie (single-device siyosati uchun, frontend X-Session-Id sifatida yuboradi).
 */
function setSessionCookie(res, sessionId) {
  res.cookie('sessionId', sessionId, {
    httpOnly: false, // frontend o'qiy olishi kerak
    secure: env.isProd,
    sameSite: env.isProd ? 'none' : 'lax',
    domain: env.COOKIE_DOMAIN,
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

function clearAuthCookies(res) {
  const opts = { domain: env.COOKIE_DOMAIN, path: '/' };
  res.clearCookie('refreshToken', opts);
  res.clearCookie('sessionId', opts);
  res.clearCookie('token', opts);
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  setRefreshCookie,
  setSessionCookie,
  clearAuthCookies,
};
