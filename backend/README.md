# Behzod Avtoustoz — Backend

Node.js + Express + MongoDB asosidagi REST API va Socket.io real-time server.
Frontend (`../frontend`) shu API'ning kontraktiga to'liq mos qurilgan.

## Talablar

- Node.js >= 18
- MongoDB (lokal yoki Atlas)

## O'rnatish

```bash
cd backend
npm install
cp .env.example .env     # qiymatlarni to'ldiring (yoki tayyor .env'dan foydalaning)
npm run seed             # admin + namuna mavzu/savol/bilet/tariflar
npm run dev              # http://localhost:5000  (nodemon)
# yoki
npm start
```

`npm run seed:fresh` — eski namuna ma'lumotni o'chirib qaytadan yaratadi.

**Seed admin:** `.env` dagi `SEED_ADMIN_PHONE` / `SEED_ADMIN_PASSWORD`
(standart: `998901234567` / `Admin123`).

## Rejimlar (dev fallback)

Kalitlar `.env`da bo'sh bo'lsa, tegishli xizmat **dev rejim**da ishlaydi:

| Xizmat | Dev rejim |
|--------|-----------|
| SMS (Eskiz) | Tasdiqlash kodi SMS o'rniga **konsolga** chiqadi |
| Click | To'lov `POST /api/payments/test/complete` orqali qo'lda tasdiqlanadi |
| Payme | `POST /api/payments/payme/perform` darhol tasdiqlaydi |

To'liq ishlashi uchun `.env`ga Eskiz / Click / Payme merchant kalitlarini qo'ying.

## Tuzilma

```
backend/
├── server.js                 # kirish nuqtasi (HTTP + Socket.io + cron)
├── .env / .env.example
└── src/
    ├── app.js                # Express ilovasi (middleware, route, error)
    ├── config/               # env, db
    ├── models/               # Mongoose modellari (User, Question, Ticket, ...)
    ├── middleware/           # auth, error, upload, language, rateLimiter
    ├── controllers/          # biznes mantiq (admin/ ichida admin)
    ├── routes/               # /api/* yo'nalishlari
    ├── services/             # token, sms, subscription, notification, payment/*
    ├── socket/               # Socket.io (real-time bildirishnoma)
    └── seed/                 # boshlang'ich ma'lumot
```

## Asosiy API yo'nalishlari (`/api`)

| Bo'lim | Yo'l |
|--------|------|
| Auth | `POST /auth/register`, `/auth/login`, `/auth/refresh`, `GET /auth/me`, `POST /auth/verify-code`, `/auth/forgot-password`, `/auth/reset-password` |
| Foydalanuvchi | `GET /users/profile`, `/users/dashboard/stats`, `/users/statistics`, `PUT /users/settings/language` |
| Testlar | `GET /tests/topics`, `/tests/tickets`, `/tests/questions/*`, `POST /tests/start`, `/tests/submit`, `GET /tests/results` |
| Demo (ochiq) | `GET /tests/demo/questions`, `POST /tests/demo/submit` |
| Bildirishnoma | `GET /notifications`, `PUT /notifications/:id/read` |
| To'lov | `GET /payments/plans`, `POST /payments/create`, Click/Payme webhook'lari |
| Ommaviy | `GET /public/settings`, `GET /health` |
| Admin | `GET /admin/dashboard/stats`, `/admin/users`, `/admin/questions`, `/admin/topics`, `/admin/tickets`, `/admin/payments`, `/admin/reports`, `/admin/settings`, `POST /admin/notifications/bulk` |

## Javob formati

```jsonc
// muvaffaqiyat
{ "success": true, "data": { ... }, "message": "..." }
// ro'yxat (sahifalangan)
{ "success": true, "data": [ ... ], "pagination": { "total", "page", "limit", "totalPages" } }
// xato
{ "success": false, "message": "..." }
// auth
{ "success": true, "token": "JWT", "user": { ... } }
```

## Autentifikatsiya

- JWT **access token** (qisqa muddatli) + **refresh token** (httpOnly cookie).
- 401 da frontend `POST /auth/refresh` orqali yangilaydi.
- **Bitta qurilma** siyosati: yangi qurilmadan kirilganda eski sessiya socket orqali chiqariladi (`force_logout`).
