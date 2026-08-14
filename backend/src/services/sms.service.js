const axios = require('axios');
const env = require('../config/env');

/**
 * Eskiz.uz SMS adapteri + "dev rejim".
 * ESKIZ_EMAIL/PASSWORD bo'lmasa SMS yuborilmaydi, matn konsolga chiqadi.
 */

let cachedToken = null;
let tokenExpiresAt = 0;

async function getEskizToken() {
  if (cachedToken && Date.now() < tokenExpiresAt) return cachedToken;
  const res = await axios.post(
    `${env.ESKIZ_BASE_URL}/auth/login`,
    { email: env.ESKIZ_EMAIL, password: env.ESKIZ_PASSWORD },
    { headers: { 'Content-Type': 'application/json' } }
  );
  cachedToken = res.data?.data?.token;
  tokenExpiresAt = Date.now() + 25 * 24 * 60 * 60 * 1000; // ~25 kun
  return cachedToken;
}

/**
 * SMS yuborish. Dev rejimda faqat log qiladi.
 * @returns {Promise<{ ok: boolean, devMode: boolean }>}
 */
async function sendSms(phone, message) {
  const to = String(phone).replace(/\D/g, '');

  if (env.smsDevMode) {
    if (env.isProd) {
      console.error('SMS yuborilmadi: Render uchun Eskiz sozlamalari kiritilmagan.');
      return { ok: false, devMode: false };
    }
    console.log('\n📱 [SMS DEV REJIM] (Eskiz sozlanmagan)');
    console.log(`   Kimga: +${to}`);
    console.log(`   Matn:  ${message}\n`);
    return { ok: true, devMode: true };
  }

  try {
    const token = await getEskizToken();
    await axios.post(
      `${env.ESKIZ_BASE_URL}/message/sms/send`,
      { mobile_phone: to, message, from: env.ESKIZ_FROM },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return { ok: true, devMode: false };
  } catch (err) {
    console.error('SMS yuborishda xato:', err.response?.data || err.message);
    return { ok: false, devMode: false };
  }
}

/**
 * 6 xonali tasdiqlash kodi yaratish.
 */
function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function sendVerificationCode(phone, code, lang = 'uz') {
  const messages = {
    uz: `Behzod Avtoustoz tasdiqlash kodi: ${code}. Hech kimga aytmang.`,
    'uz-Cyrl': `Behzod Avtoustoz тасдиқлаш коди: ${code}. Ҳеч кимга айтманг.`,
    ru: `Код подтверждения Behzod Avtoustoz: ${code}. Никому не сообщайте.`,
  };
  return sendSms(phone, messages[lang] || messages.uz);
}

module.exports = { sendSms, sendVerificationCode, generateCode };
