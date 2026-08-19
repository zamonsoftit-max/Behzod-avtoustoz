const User = require('../models/User');
const TestResult = require('../models/TestResult');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/response');
const { getPaging } = require('../utils/pagination');

// GET /users/profile
exports.getProfile = asyncHandler(async (req, res) => {
  return ok(res, req.user.toJSON());
});

// PUT /users/profile
exports.updateProfile = asyncHandler(async (req, res) => {
  const allowed = ['firstName', 'lastName'];
  allowed.forEach((f) => {
    if (req.body[f] !== undefined) req.user[f] = req.body[f];
  });
  if (req.body.fullName !== undefined) {
    const parts = String(req.body.fullName).trim().split(/\s+/);
    req.user.firstName = parts[0] || '';
    req.user.lastName = parts.slice(1).join(' ') || '';
  }
  await req.user.save();
  return ok(res, req.user.toJSON(), 'Profil yangilandi');
});

// POST /users/profile/avatar  (multipart: avatar)
exports.uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('Rasm yuklanmadi');
  req.user.avatar = `/uploads/avatars/${req.file.filename}`;
  await req.user.save();
  return ok(res, { avatar: req.user.avatar }, 'Rasm yangilandi');
});

// GET /users/dashboard/stats
exports.getDashboardStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const results = await TestResult.find({ user: userId }).sort({ createdAt: -1 });

  const totalTests = results.length;
  const passedTests = results.filter((r) => r.isPassed).length;
  const totalCorrect = results.reduce((s, r) => s + (r.correctAnswers || 0), 0);
  const totalQuestions = results.reduce((s, r) => s + (r.totalQuestions || 0), 0);
  const averageScore = totalTests ? Math.round(results.reduce((s, r) => s + (r.percentage || 0), 0) / totalTests) : 0;
  const preparationLevel = totalQuestions ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  // So'nggi 7 kunlik faollik
  const dailyActivity = [];
  for (let i = 6; i >= 0; i -= 1) {
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - i);
    const next = new Date(day);
    next.setDate(next.getDate() + 1);
    const count = results.filter((r) => r.createdAt >= day && r.createdAt < next).length;
    dailyActivity.push({ date: day.toISOString().slice(0, 10), count });
  }

  return ok(res, {
    totalTests,
    passedTests,
    averageScore,
    preparationLevel,
    hasActiveSubscription: req.user.hasActiveSubscription(),
    subscription: req.user.subscription,
    dailyActivity,
    recentTests: results.slice(0, 5).map((r) => ({
      _id: r._id,
      testType: r.testType,
      percentage: r.percentage,
      correctAnswers: r.correctAnswers,
      totalQuestions: r.totalQuestions,
      isPassed: r.isPassed,
      createdAt: r.createdAt,
    })),
  });
});

// GET /users/statistics
exports.getStatistics = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const results = await TestResult.find({ user: userId }).populate('topic', 'name').sort({ createdAt: -1 });

  const totalTests = results.length;
  const totalCorrect = results.reduce((s, r) => s + (r.correctAnswers || 0), 0);
  const totalWrong = results.reduce((s, r) => s + (r.wrongAnswers || 0), 0);
  const totalQuestions = results.reduce((s, r) => s + (r.totalQuestions || 0), 0);
  const totalTime = results.reduce((s, r) => s + (r.timeSpent || 0), 0);

  // Mavzu bo'yicha progress
  const byTopic = {};
  results.forEach((r) => {
    if (!r.topic) return;
    const id = r.topic._id.toString();
    if (!byTopic[id]) byTopic[id] = { topic: r.topic, tests: 0, correct: 0, total: 0 };
    byTopic[id].tests += 1;
    byTopic[id].correct += r.correctAnswers || 0;
    byTopic[id].total += r.totalQuestions || 0;
  });
  const topicProgress = Object.values(byTopic).map((t) => ({
    topic: t.topic,
    tests: t.tests,
    accuracy: t.total ? Math.round((t.correct / t.total) * 100) : 0,
  }));

  // So'nggi 30 kunlik faollik
  const dailyActivity = [];
  for (let i = 29; i >= 0; i -= 1) {
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - i);
    const next = new Date(day);
    next.setDate(next.getDate() + 1);
    const dayResults = results.filter((r) => r.createdAt >= day && r.createdAt < next);
    dailyActivity.push({
      date: day.toISOString().slice(0, 10),
      count: dayResults.length,
      avgScore: dayResults.length
        ? Math.round(dayResults.reduce((s, r) => s + (r.percentage || 0), 0) / dayResults.length)
        : 0,
    });
  }

  return ok(res, {
    overall: {
      totalTests,
      totalCorrect,
      totalWrong,
      totalQuestions,
      accuracy: totalQuestions ? Math.round((totalCorrect / totalQuestions) * 100) : 0,
      averageScore: totalTests ? Math.round(results.reduce((s, r) => s + (r.percentage || 0), 0) / totalTests) : 0,
      passedTests: results.filter((r) => r.isPassed).length,
      studyTimeSeconds: totalTime,
    },
    topicProgress,
    mostMistakes: topicProgress
      .slice()
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 5),
    dailyActivity,
    recentTests: results.slice(0, 10).map((r) => ({
      _id: r._id,
      testType: r.testType,
      percentage: r.percentage,
      correctAnswers: r.correctAnswers,
      totalQuestions: r.totalQuestions,
      isPassed: r.isPassed,
      createdAt: r.createdAt,
    })),
    period: '30d',
  });
});

// GET /users/test-history
exports.getTestHistory = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaging(req.query);
  const filter = { user: req.user._id };
  const [items, total] = await Promise.all([
    TestResult.find(filter).populate('topic', 'name').populate('ticket', 'number name').sort({ createdAt: -1 }).skip(skip).limit(limit),
    TestResult.countDocuments(filter),
  ]);
  return res.json({
    success: true,
    data: items,
    pagination: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) },
  });
});

// PUT /users/settings/language  { language }
exports.updateLanguage = asyncHandler(async (req, res) => {
  const { language } = req.body;
  if (!['uz', 'uz-Cyrl', 'ru'].includes(language)) throw ApiError.badRequest('Til noto\'g\'ri');
  req.user.language = language;
  await req.user.save();
  return ok(res, { language }, 'Til o\'zgartirildi');
});

// PUT /users/settings/theme  { theme }
exports.updateTheme = asyncHandler(async (req, res) => {
  const { theme } = req.body;
  if (!['light', 'dark'].includes(theme)) throw ApiError.badRequest('Mavzu noto\'g\'ri');
  req.user.theme = theme;
  await req.user.save();
  return ok(res, { theme }, 'Mavzu o\'zgartirildi');
});

// DELETE /users/account  { password }
exports.deleteAccount = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+password');
  const match = await user.comparePassword(req.body.password || '');
  if (!match) throw ApiError.badRequest('Parol noto\'g\'ri');

  await TestResult.deleteMany({ user: user._id });
  await user.deleteOne();
  return ok(res, null, 'Hisobingiz o\'chirildi');
});
