const User = require('../../models/User');
const ApiError = require('../../utils/ApiError');
const asyncHandler = require('../../utils/asyncHandler');
const { ok } = require('../../utils/response');
const notify = require('../../services/notification.service');

// POST /admin/notifications/bulk
// { title, message, type?, priority?, target?: 'all'|'subscribers'|'specific', userIds?: [] }
exports.bulkSend = asyncHandler(async (req, res) => {
  const { title, message, type = 'info', priority = 'medium', target = 'all', userIds = [] } = req.body;
  if (!title || !message) throw ApiError.badRequest('Sarlavha va matn majburiy');

  let recipients = [];
  if (target === 'specific') {
    if (!userIds.length) throw ApiError.badRequest('Foydalanuvchilar tanlanmagan');
    recipients = userIds;
  } else if (target === 'subscribers') {
    const subs = await User.find({
      role: 'student',
      'subscription.isActive': true,
      'subscription.endDate': { $gt: new Date() },
    }).select('_id');
    recipients = subs.map((u) => u._id);
  } else {
    const all = await User.find({ role: 'student' }).select('_id');
    recipients = all.map((u) => u._id);
  }

  const result = await notify.notifyMany(recipients, { title, message, type, priority });
  return ok(res, result, `${result.count} ta foydalanuvchiga yuborildi`);
});
