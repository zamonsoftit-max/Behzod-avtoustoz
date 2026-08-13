const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');

const env = require('./config/env');
const language = require('./middleware/language');
const { apiLimiter } = require('./middleware/rateLimiter');
const { notFound, errorHandler } = require('./middleware/error');
const routes = require('./routes');

const app = express();

app.set('trust proxy', 1);

// Xavfsizlik va asoslar
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(compression());

// CORS — frontend bilan cookie almashish uchun credentials
const allowedOrigins = env.CLIENT_URL.split(',').map((s) => s.trim()).filter(Boolean);
app.use(
  cors({
    origin(origin, cb) {
      // origin yo'q (Postman, server-server, health check) — ruxsat
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      // Dev rejimda har qanday origin'ga ruxsat (qulaylik uchun)
      if (!env.isProd) return cb(null, true);
      // Production: faqat CLIENT_URL ro'yxatidagilar
      return cb(new Error(`CORS: ruxsat etilmagan origin (${origin})`));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(language);

if (!env.isProd) app.use(morgan('dev'));

// Statik: yuklangan fayllar
app.use('/uploads', express.static(path.join(__dirname, '..', env.UPLOAD_DIR)));

// API
app.use('/api', apiLimiter, routes);

app.get('/', (req, res) => {
  res.json({ success: true, message: 'Behzod Avtoustoz API', version: '1.0.0' });
});

// 404 + xato boshqaruvi
app.use(notFound);
app.use(errorHandler);

module.exports = app;
