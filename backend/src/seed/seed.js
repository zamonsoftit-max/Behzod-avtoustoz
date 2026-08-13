/* eslint-disable no-console */
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const env = require('../config/env');

const User = require('../models/User');
const Topic = require('../models/Topic');
const Question = require('../models/Question');
const Ticket = require('../models/Ticket');
const Settings = require('../models/Settings');

const FRESH = process.argv.includes('--fresh');

// ===== Namuna mavzular =====
const TOPICS = [
  { name: { uz: 'Yo\'l belgilari', 'uz-Cyrl': 'Йўл белгилари', ru: 'Дорожные знаки' }, icon: '🚸', order: 1 },
  { name: { uz: 'Svetofor va regulirovshik signallari', 'uz-Cyrl': 'Светофор ва регулировшик сигналлари', ru: 'Сигналы светофора и регулировщика' }, icon: '🚦', order: 2 },
  { name: { uz: 'Yo\'l harakati qoidalari', 'uz-Cyrl': 'Йўл ҳаракати қоидалари', ru: 'Правила дорожного движения' }, icon: '🛣️', order: 3 },
  { name: { uz: 'Tezlik va masofa', 'uz-Cyrl': 'Тезлик ва масофа', ru: 'Скорость и дистанция' }, icon: '⏱️', order: 4 },
  { name: { uz: 'Birinchi tibbiy yordam', 'uz-Cyrl': 'Биринчи тиббий ёрдам', ru: 'Первая медицинская помощь' }, icon: '🏥', order: 5 },
];

// ===== Namuna savollar (topicIndex -> TOPICS dagi tartib) =====
function q(topicIndex, uz, uzc, ru, options, correctIdx, explanation) {
  return {
    topicIndex,
    question: { uz, 'uz-Cyrl': uzc, ru },
    options: options.map((opt, i) => ({
      text: { uz: opt[0], 'uz-Cyrl': opt[1], ru: opt[2] },
      isCorrect: i === correctIdx,
    })),
    explanation: explanation || { uz: '', 'uz-Cyrl': '', ru: '' },
  };
}

const QUESTIONS = [
  q(0, 'Uchburchak shaklidagi qizil hoshiyali belgilar qanday belgilar?', 'Учбурчак шаклидаги қизил ҳошияли белгилар қандай белгилар?', 'Знаки треугольной формы с красной каймой — это какие знаки?',
    [['Ogohlantiruvchi', 'Огоҳлантирувчи', 'Предупреждающие'], ['Taqiqlovchi', 'Тақиқловчи', 'Запрещающие'], ['Axborot beruvchi', 'Ахборот берувчи', 'Информационные'], ['Buyuruvchi', 'Буюрувчи', 'Предписывающие']], 0,
    { uz: 'Uchburchak qizil hoshiyali belgilar — ogohlantiruvchi belgilardir.', 'uz-Cyrl': 'Учбурчак қизил ҳошияли белгилар — огоҳлантирувчи белгилардир.', ru: 'Треугольные знаки с красной каймой — предупреждающие.' }),

  q(0, 'Doira shaklidagi qizil hoshiyali belgilar nimani bildiradi?', 'Доира шаклидаги қизил ҳошияли белгилар нимани билдиради?', 'Что обозначают круглые знаки с красной каймой?',
    [['Ruxsat beruvchi', 'Рухсат берувчи', 'Разрешающие'], ['Taqiqlovchi', 'Тақиқловчи', 'Запрещающие'], ['Ogohlantiruvchi', 'Огоҳлантирувчи', 'Предупреждающие'], ['Servis', 'Сервис', 'Сервиса']], 1),

  q(1, 'Svetoforning qizil signali nimani anglatadi?', 'Светофорнинг қизил сигнали нимани англатади?', 'Что означает красный сигнал светофора?',
    [['Harakatni davom ettirish', 'Ҳаракатни давом эттириш', 'Продолжить движение'], ['Tayyorlanish', 'Тайёрланиш', 'Приготовиться'], ['Harakat taqiqlanadi', 'Ҳаракат тақиқланади', 'Движение запрещено'], ['Tezlikni oshirish', 'Тезликни ошириш', 'Увеличить скорость']], 2),

  q(1, 'Svetoforning sariq signali yonganda nima qilish kerak?', 'Светофорнинг сариқ сигнали ёнганда нима қилиш керак?', 'Что нужно делать при жёлтом сигнале светофора?',
    [['To\'xtashga tayyorlanish', 'Тўхташга тайёрланиш', 'Приготовиться к остановке'], ['Tezlashtirib o\'tib ketish', 'Тезлаштириб ўтиб кетиш', 'Ускориться и проехать'], ['Orqaga yurish', 'Орқага юриш', 'Двигаться назад'], ['Signal berish', 'Сигнал бериш', 'Подать сигнал']], 0),

  q(2, 'Aholi punktlarida umumiy holatda ruxsat etilgan maksimal tezlik qancha?', 'Аҳоли пунктларида умумий ҳолатда рухсат этилган максимал тезлик қанча?', 'Какая максимальная скорость разрешена в населённых пунктах?',
    [['40 km/soat', '40 км/соат', '40 км/ч'], ['60 km/soat', '60 км/соат', '60 км/ч'], ['70 km/soat', '70 км/соат', '70 км/ч'], ['90 km/soat', '90 км/соат', '90 км/ч']], 1,
    { uz: 'Aholi punktlarida umumiy tezlik chegarasi 60 km/soat.', 'uz-Cyrl': 'Аҳоли пунктларида умумий тезлик чегараси 60 км/соат.', ru: 'Общее ограничение скорости в населённых пунктах — 60 км/ч.' }),

  q(2, 'Chorrahaga yaqinlashganda haydovchi nima qilishi kerak?', 'Чоррахага яқинлашганда ҳайдовчи нима қилиши керак?', 'Что должен сделать водитель при приближении к перекрёстку?',
    [['Tezlikni oshirish', 'Тезликни ошириш', 'Увеличить скорость'], ['Ehtiyotkorlikni oshirish', 'Эҳтиёткорликни ошириш', 'Повысить внимательность'], ['Telefon ishlatish', 'Телефон ишлатиш', 'Пользоваться телефоном'], ['To\'xtab qolish', 'Тўхтаб қолиш', 'Остановиться']], 1),

  q(3, 'Quruq asfaltda 90 km/soat tezlikda to\'xtash masofasi taxminan qancha?', 'Қуруқ асфалтда 90 км/соат тезликда тўхташ масофаси тахминан қанча?', 'Каков примерный тормозной путь при 90 км/ч на сухом асфальте?',
    [['10-15 metr', '10-15 метр', '10-15 метров'], ['25-30 metr', '25-30 метр', '25-30 метров'], ['50-60 metr', '50-60 метр', '50-60 метров'], ['100 metr', '100 метр', '100 метров']], 2),

  q(3, 'Oldindagi transport vositasi bilan xavfsiz masofa nimaga bog\'liq?', 'Олдиндаги транспорт воситаси билан хавфсиз масофа нимага боғлиқ?', 'От чего зависит безопасная дистанция до впереди идущего транспорта?',
    [['Faqat rangiga', 'Фақат рангига', 'Только от цвета'], ['Tezlik va yo\'l holatiga', 'Тезлик ва йўл ҳолатига', 'От скорости и состояния дороги'], ['Yo\'lovchilar soniga', 'Йўловчилар сонига', 'От числа пассажиров'], ['Vaqtga', 'Вақтга', 'От времени']], 1),

  q(4, 'Yo\'l-transport hodisasida birinchi navbatda nima qilish kerak?', 'Йўл-транспорт ҳодисасида биринчи навбатда нима қилиш керак?', 'Что нужно сделать в первую очередь при ДТП?',
    [['Ketib qolish', 'Кетиб қолиш', 'Уехать'], ['Jabrlanganlarga yordam berish va 103/112 ga qo\'ng\'iroq qilish', 'Жабрланганларга ёрдам бериш ва 103/112 га қўнғироқ қилиш', 'Помочь пострадавшим и позвонить 103/112'], ['Suratga olish', 'Суратга олиш', 'Сфотографировать'], ['Kutib turish', 'Кутиб туриш', 'Подождать']], 1),

  q(4, 'Qon ketishini to\'xtatish uchun jgut (turniket) qancha vaqtga qo\'yiladi (yozda)?', 'Қон кетишини тўхтатиш учун жгут (турникет) қанча вақтга қўйилади (ёзда)?', 'На какое время накладывается жгут летом для остановки кровотечения?',
    [['30 daqiqa', '30 дақиқа', '30 минут'], ['1 soatgacha', '1 соатгача', 'До 1 часа'], ['2 soat', '2 соат', '2 часа'], ['Cheklov yo\'q', 'Чеклов йўқ', 'Без ограничений']], 1),
];

// ===== Narx rejalari =====
const PLANS = [
  { key: 'monthly', name: { uz: '1 oylik', 'uz-Cyrl': '1 ойлик', ru: '1 месяц' }, price: 29000, durationDays: 30, type: 'premium', features: ['Barcha testlar', 'Statistika', 'Xato savollar'] },
  { key: 'quarterly', name: { uz: '3 oylik', 'uz-Cyrl': '3 ойлик', ru: '3 месяца' }, price: 75000, durationDays: 90, type: 'premium', popular: true, features: ['Barcha testlar', 'Statistika', 'Xato savollar', '20% chegirma'] },
  { key: 'yearly', name: { uz: '1 yillik', 'uz-Cyrl': '1 йиллик', ru: '1 год' }, price: 250000, durationDays: 365, type: 'pro', features: ['Barcha testlar', 'Statistika', 'Xato savollar', 'Eng yaxshi narx'] },
];

async function seed() {
  await connectDB();
  console.log(`\n🌱 Seed boshlandi ${FRESH ? '(--fresh: eski ma\'lumot o\'chiriladi)' : ''}\n`);

  if (FRESH) {
    await Promise.all([
      Topic.deleteMany({}),
      Question.deleteMany({}),
      Ticket.deleteMany({}),
      User.deleteMany({ role: 'admin' }),
    ]);
    console.log('🗑️  Eski mavzu/savol/bilet/admin o\'chirildi');
  }

  // 1) Sozlamalar
  const settings = await Settings.getSingleton();
  settings.subscriptionPlans = PLANS;
  settings.contactInfo = { phone: '+998 90 123 45 67', email: 'info@behzod-avtoustoz.uz', telegram: '@behzod_avtoustoz', address: 'Toshkent' };
  await settings.save();
  console.log('⚙️  Sozlamalar va narx rejalari saqlandi');

  // 2) Admin
  const adminPhone = env.SEED_ADMIN_PHONE;
  let admin = await User.findOne({ phoneNumber: adminPhone });
  if (!admin) {
    admin = await User.create({
      firstName: 'Behzod',
      lastName: 'Admin',
      phoneNumber: adminPhone,
      password: env.SEED_ADMIN_PASSWORD,
      role: 'admin',
      isVerified: true,
    });
    console.log(`👤 Admin yaratildi: ${adminPhone} / parol: ${env.SEED_ADMIN_PASSWORD}`);
  } else {
    console.log(`👤 Admin allaqachon mavjud: ${adminPhone}`);
  }

  // 3) Mavzular
  const existingTopics = await Topic.countDocuments();
  let topicDocs;
  if (existingTopics === 0) {
    topicDocs = await Topic.insertMany(TOPICS.map((t) => ({ ...t, isActive: true })));
    console.log(`📚 ${topicDocs.length} ta mavzu yaratildi`);
  } else {
    topicDocs = await Topic.find().sort({ order: 1 });
    console.log(`📚 Mavzular mavjud (${topicDocs.length} ta) — o'tkazib yuborildi`);
  }

  // 4) Savollar
  const existingQuestions = await Question.countDocuments();
  if (existingQuestions === 0) {
    const docs = QUESTIONS.map((item) => ({
      question: item.question,
      options: item.options,
      explanation: item.explanation,
      topic: topicDocs[item.topicIndex]._id,
      difficulty: 'medium',
      isActive: true,
    }));
    await Question.insertMany(docs);
    console.log(`❓ ${docs.length} ta savol yaratildi`);
  } else {
    console.log(`❓ Savollar mavjud (${existingQuestions} ta) — o'tkazib yuborildi`);
  }

  // 5) Bilet (mavjud savollardan bittasi)
  const existingTickets = await Ticket.countDocuments();
  if (existingTickets === 0) {
    const allQ = await Question.find({ isActive: true }).select('_id');
    if (allQ.length) {
      await Ticket.create({ number: 1, questions: allQ.map((x) => x._id), isActive: true });
      console.log('🎫 1-bilet yaratildi (barcha namuna savollar bilan)');
    }
  } else {
    console.log(`🎫 Biletlar mavjud (${existingTickets} ta) — o'tkazib yuborildi`);
  }

  console.log('\n✅ Seed tugadi!\n');
  await mongoose.connection.close();
  process.exit(0);
}

seed().catch(async (err) => {
  console.error('❌ Seed xatosi:', err);
  try { await mongoose.connection.close(); } catch {}
  process.exit(1);
});
