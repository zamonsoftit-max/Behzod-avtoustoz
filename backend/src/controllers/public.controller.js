const Settings = require('../models/Settings');
const Topic = require('../models/Topic');
const Question = require('../models/Question');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/response');

// GET /public/settings — ochiq (maxfiy bo'lmagan) sozlamalar
exports.getPublicSettings = asyncHandler(async (req, res) => {
  const settings = await Settings.getSingleton();
  const [topicCount, questionCount, userCount] = await Promise.all([
    Topic.countDocuments({ isActive: true }),
    Question.countDocuments({ isActive: true }),
    User.countDocuments({ role: 'student' }),
  ]);

  return ok(res, {
    siteName: settings.siteName,
    contactInfo: settings.contactInfo,
    examSettings: settings.examSettings,
    demoSettings: settings.demoSettings,
    subscriptionPlans: settings.subscriptionPlans.filter((p) => p.isActive),
    maintenanceMode: settings.maintenanceMode,
    stats: { topicCount, questionCount, userCount },
  });
});
