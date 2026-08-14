const http = require('http');
const env = require('./src/config/env');
const connectDB = require('./src/config/db');
const app = require('./src/app');
const { initSocket } = require('./src/socket');
const { deactivateExpired } = require('./src/services/subscription.service');
const Settings = require('./src/models/Settings');

async function start() {
  await connectDB();

  // Amaldagi bazadagi 1 oylik tarif narxini yangilash.
  await Settings.updateOne(
    { singleton: 'main', 'subscriptionPlans.key': 'monthly' },
    { $set: { 'subscriptionPlans.$.price': 45000 } }
  );

  const server = http.createServer(app);
  initSocket(server);

  server.listen(env.PORT, () => {
    console.log('\n========================================');
    console.log(`🚗 Behzod Avtoustoz API`);
    console.log(`   Rejim:   ${env.NODE_ENV}`);
    console.log(`   Manzil:  http://localhost:${env.PORT}`);
    console.log(`   SMS:     ${env.smsDevMode ? 'DEV (konsolga chiqadi)' : 'Eskiz.uz'}`);
    console.log(`   Click:   ${env.clickDevMode ? 'DEV/manual' : 'faol'}`);
    console.log(`   Payme:   ${env.paymeDevMode ? 'DEV/manual' : 'faol'}`);
    console.log('========================================\n');
  });

  // Har soatda muddati o'tgan obunalarni nofaol qilish
  setInterval(() => {
    deactivateExpired()
      .then((n) => { if (n) console.log(`ℹ️  ${n} ta obuna muddati tugadi`); })
      .catch(() => {});
  }, 60 * 60 * 1000);

  // Xatolarni ushlash
  process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err);
  });
}

start().catch((err) => {
  console.error('Server ishga tushmadi:', err);
  process.exit(1);
});
