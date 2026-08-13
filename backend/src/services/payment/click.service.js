const crypto = require('crypto');
const env = require('../../config/env');

/**
 * Click "Merchant API" (Prepare / Complete) protokoli.
 * Hujjat: https://docs.click.uz/
 *
 * Dev rejimda (kalitlar bo'sh) imzo tekshiruvi o'tkazib yuboriladi.
 */

const ERR = {
  SUCCESS: 0,
  SIGN_CHECK_FAILED: -1,
  INCORRECT_AMOUNT: -2,
  ACTION_NOT_FOUND: -3,
  ALREADY_PAID: -4,
  USER_NOT_FOUND: -5,
  TRANSACTION_NOT_FOUND: -6,
  FAILED_TO_UPDATE: -7,
  ERROR_IN_REQUEST: -8,
  TRANSACTION_CANCELLED: -9,
};

/**
 * Click imzosini tekshirish (md5).
 * Prepare:  md5(click_trans_id + service_id + SECRET_KEY + merchant_trans_id + amount + action + sign_time)
 * Complete: md5(click_trans_id + service_id + SECRET_KEY + merchant_trans_id + merchant_prepare_id + amount + action + sign_time)
 */
function verifySign(body) {
  if (env.clickDevMode) return true; // dev rejim: imzo tekshirilmaydi
  const {
    click_trans_id,
    service_id,
    merchant_trans_id,
    merchant_prepare_id,
    amount,
    action,
    sign_time,
    sign_string,
  } = body;

  const parts = [click_trans_id, service_id, env.CLICK_SECRET_KEY, merchant_trans_id];
  if (action === '1' || action === 1) parts.push(merchant_prepare_id);
  parts.push(amount, action, sign_time);

  const hash = crypto.createHash('md5').update(parts.join('')).digest('hex');
  return hash === sign_string;
}

function buildError(code, note) {
  return { error: code, error_note: note };
}

/**
 * To'lov sahifasi havolasini yaratish.
 */
function buildPaymentUrl({ amount, transactionId, returnUrl }) {
  const params = new URLSearchParams({
    service_id: env.CLICK_SERVICE_ID || 'DEV',
    merchant_id: env.CLICK_MERCHANT_ID || 'DEV',
    amount: String(amount),
    transaction_param: transactionId,
    return_url: returnUrl || '',
  });
  return `https://my.click.uz/services/pay?${params.toString()}`;
}

module.exports = { ERR, verifySign, buildError, buildPaymentUrl };
