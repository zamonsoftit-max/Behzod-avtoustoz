require('dotenv').config();

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT, 10) || 5000,
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',

  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/behzod_avtoustoz',

  JWT_SECRET: process.env.JWT_SECRET || 'dev_access_secret',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  COOKIE_DOMAIN: process.env.COOKIE_DOMAIN || undefined,

  UPLOAD_DIR: process.env.UPLOAD_DIR || 'uploads',
  MAX_FILE_SIZE_MB: parseInt(process.env.MAX_FILE_SIZE_MB, 10) || 5,

  SMS_PROVIDER: process.env.SMS_PROVIDER || 'eskiz',
  ESKIZ_EMAIL: process.env.ESKIZ_EMAIL || '',
  ESKIZ_PASSWORD: process.env.ESKIZ_PASSWORD || '',
  ESKIZ_FROM: process.env.ESKIZ_FROM || '4546',
  ESKIZ_BASE_URL: process.env.ESKIZ_BASE_URL || 'https://notify.eskiz.uz/api',

  CLICK_MERCHANT_ID: process.env.CLICK_MERCHANT_ID || '',
  CLICK_SERVICE_ID: process.env.CLICK_SERVICE_ID || '',
  CLICK_SECRET_KEY: process.env.CLICK_SECRET_KEY || '',
  CLICK_MERCHANT_USER_ID: process.env.CLICK_MERCHANT_USER_ID || '',

  PAYME_MERCHANT_ID: process.env.PAYME_MERCHANT_ID || '',
  PAYME_SECRET_KEY: process.env.PAYME_SECRET_KEY || '',
  PAYME_CHECKOUT_URL: process.env.PAYME_CHECKOUT_URL || 'https://checkout.paycom.uz',

  SEED_ADMIN_PHONE: process.env.SEED_ADMIN_PHONE || '998901234567',
  SEED_ADMIN_PASSWORD: process.env.SEED_ADMIN_PASSWORD || 'Admin123',
};

// Qulay yordamchi bayroqlar (dev rejimlarni aniqlash uchun)
env.isProd = env.NODE_ENV === 'production';
env.smsDevMode = !env.ESKIZ_EMAIL || !env.ESKIZ_PASSWORD;
env.clickDevMode = !env.CLICK_SERVICE_ID || !env.CLICK_SECRET_KEY;
env.paymeDevMode = !env.PAYME_MERCHANT_ID || !env.PAYME_SECRET_KEY;

module.exports = env;
