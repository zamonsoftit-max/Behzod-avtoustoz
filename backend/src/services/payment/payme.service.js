const env = require('../../config/env');

/**
 * Payme Merchant API (JSON-RPC 2.0) protokoli.
 * Hujjat: https://developer.help.paycom.uz/
 *
 * Dev rejimda (kalitlar bo'sh) Authorization tekshiruvi o'tkazib yuboriladi.
 */

// Payme xato kodlari
const ERR = {
  TRANSPORT: -32300,
  PARSE: -32700,
  RPC_METHOD_NOT_FOUND: -32601,
  INSUFFICIENT_PRIVILEGE: -32504,
  INVALID_AMOUNT: -31001,
  TRANSACTION_NOT_FOUND: -31003,
  CANT_PERFORM: -31008,
  CANT_CANCEL: -31007,
  ORDER_NOT_FOUND: -31050, // account.order_id topilmadi (-31050..-31099 oralig'i)
  ORDER_ALREADY_PAID: -31051,
};

// Payme tranzaksiya holatlari
const STATE = {
  CREATED: 1,
  PERFORMED: 2,
  CANCELLED: -1,
  CANCELLED_AFTER_PERFORM: -2,
};

/**
 * Basic Authorization sarlavhasini tekshirish: "Paycom:SECRET_KEY".
 */
function checkAuth(req) {
  if (env.paymeDevMode) return true;
  const header = req.headers.authorization || '';
  if (!header.startsWith('Basic ')) return false;
  const decoded = Buffer.from(header.slice(6), 'base64').toString('utf8'); // "Paycom:KEY"
  const key = decoded.split(':')[1];
  return key === env.PAYME_SECRET_KEY;
}

function rpcError(id, code, message, data) {
  return {
    jsonrpc: '2.0',
    id: id ?? null,
    error: { code, message: typeof message === 'string' ? { uz: message, ru: message, en: message } : message, data },
  };
}

function rpcResult(id, result) {
  return { jsonrpc: '2.0', id: id ?? null, result };
}

/**
 * To'lov sahifasi havolasi (GET orqali base64 parametrlar bilan).
 * amount Payme'da tiyinda (so'm * 100).
 */
function buildCheckoutUrl({ amount, orderId, returnUrl }) {
  const params = `m=${env.PAYME_MERCHANT_ID || 'DEV'};ac.order_id=${orderId};a=${amount * 100};c=${returnUrl || ''}`;
  const encoded = Buffer.from(params).toString('base64');
  return `${env.PAYME_CHECKOUT_URL}/${encoded}`;
}

module.exports = { ERR, STATE, checkAuth, rpcError, rpcResult, buildCheckoutUrl };
