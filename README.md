# Behzod Avtoustoz

O'zbekistonda haydovchilik imtihoniga professional tayyorgarlik platformasi (monorepo).

## Tuzilma

```
behzod-avtoustoz/
├── frontend/   # React.js + Tailwind CSS (mijoz qismi)
└── backend/    # Node.js + Express + MongoDB (server qismi)
```

## Texnologiyalar

| Qism | Texnologiya |
|------|-------------|
| Frontend | React 18, Redux Toolkit, Tailwind CSS, i18next, Socket.io-client |
| Backend | Node.js, Express, MongoDB (Mongoose), Socket.io, JWT |
| To'lov | Click, Payme |
| SMS | Eskiz.uz |

## Tez ishga tushirish

### 1. Backend
```bash
cd backend
npm install
cp .env.example .env      # va qiymatlarni to'ldiring
npm run seed              # boshlang'ich ma'lumot (admin + namuna savollar)
npm run dev               # http://localhost:5000
```

### 2. Frontend
```bash
cd frontend
npm install
npm start                 # http://localhost:3000
```

## Deploy (Vercel + Render + MongoDB Atlas)

Tartib muhim: **Atlas → Render (backend) → Vercel (frontend) → Render CLIENT_URL'ni yangilash**.

### 1. MongoDB Atlas (baza)
1. [cloud.mongodb.com](https://cloud.mongodb.com) — bepul **M0** klaster yarating (region: Frankfurt/Europe).
2. **Database Access** → foydalanuvchi (login/parol) qo'shing.
3. **Network Access** → `0.0.0.0/0` (hammaga ruxsat — Render IP o'zgaruvchan).
4. **Connect → Drivers** → ulanish satrini oling:
   `mongodb+srv://user:parol@cluster.xxx.mongodb.net/behzod_avtoustoz`

### 2. Render (backend)
1. [render.com](https://render.com) → **New → Blueprint** → shu GitHub repo'ni tanlang (`render.yaml` avtomatik o'qiladi).
2. Environment Variables'da qo'lda kiriting:
   - `MONGODB_URI` = Atlas satri (yuqoridagi)
   - `CLIENT_URL` = Vercel domeni (masalan, `https://behzod-avtoustoz.vercel.app`)
3. Deploy bo'lgach backend manzilini oling: `https://behzod-avtoustoz-api.onrender.com`
4. **Seed:** lokalda `backend/.env` ichida `MONGODB_URI`ni Atlas'ga o'zgartirib `npm run seed` ishlating (admin + namuna ma'lumot Atlas'ga yoziladi).

### 3. Vercel (frontend)
1. [vercel.com](https://vercel.com) → **Add New → Project** → shu repo.
2. **Root Directory** = `frontend` (muhim!).
3. Environment Variables:
   - `REACT_APP_API_URL` = `https://behzod-avtoustoz-api.onrender.com/api`
   - `REACT_APP_SOCKET_URL` = `https://behzod-avtoustoz-api.onrender.com`
4. Deploy → frontend manzilini oling: `https://behzod-avtoustoz.vercel.app`

### 4. Yakuniy ulash
Render dashboard'da `CLIENT_URL`ni Vercel manziliga aniq tenglang (oxirida `/` belgisisiz):
`CLIENT_URL=https://behzod-avtoustoz.vercel.app` → backend qayta deploy bo'ladi.

> ⚠️ Render bepul tarif ~15 daqiqa harakatsizlikdan keyin "uxlaydi" — birinchi so'rov 30-60s sekin bo'lishi mumkin.

### GitHub'ga birinchi yuklash

```bash
git init
git add .
git commit -m "Prepare deployment for Vercel Render and MongoDB Atlas"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
git push -u origin main
```

Render va Vercel shu GitHub repo'ga ulanadi.

### Muhim production eslatma

Render disk maydoni doimiy emas: `backend/uploads` ichidagi avatar va savol rasmlari
restart/redeploydan keyin yo‘qolishi mumkin. Productionda rasmlarni Cloudinary yoki
Amazon S3 kabi doimiy object storage'ga ko‘chirish kerak; MongoDB Atlas faqat ma'lumotlar
bazasini saqlaydi.

## Hujjatlar

- Backend API va sozlamalar: [`backend/README.md`](backend/README.md)

## Litsenziya

Private — Barcha huquqlar himoyalangan.
