const Notification = require('../models/Notification');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/response');
const { getPaging } = require('../utils/pagination');
const socket = require('../socket');

// GET /notifications
exports.list = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaging(req.query);
  const filter = { user: req.user._id };
  if (req.query.filter === 'unread') filter.isRead = false;
  if (req.query.filter === 'read') filter.isRead = true;

  const [items, total, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments(filter),
    Notification.countDocuments({ user: req.user._id, isRead: false }),
  ]);

  return res.json({
    success: true,
    data: items,
    unreadCount,
    pagination: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) },
  });
});

// GET /notifications/unread-count
exports.unreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({ user: req.user._id, isRead: false });
  return res.json({ success: true, unreadCount: count, data: { count } });
});

// PUT /notifications/:id/read
exports.markRead = asyncHandler(async (req, res) => {
  const n = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { isRead: true, readAt: new Date() },
    { new: true }
  );
  if (!n) throw ApiError.notFound('Bildirishnoma topilmadi');
  socket.emitToUser(req.user._id, 'notification:read', req.params.id);
  return ok(res, n, 'O\'qilgan deb belgilandi');
});

// PUT /notifications/mark-all-read
exports.markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true, readAt: new Date() });
  socket.emitToUser(req.user._id, 'notification:all-read');
  return ok(res, null, 'Barchasi o\'qilgan deb belgilandi');
});

// DELETE /notifications/:id
exports.remove = asyncHandler(async (req, res) => {
  const n = await Notification.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!n) throw ApiError.notFound('Bildirishnoma topilmadi');
  return ok(res, null, 'O\'chirildi');
});

// DELETE /notifications/clear-all
exports.clearAll = asyncHandler(async (req, res) => {
  await Notification.deleteMany({ user: req.user._id });
  return ok(res, null, 'Barcha bildirishnomalar o\'chirildi');
});

// GET /notifications/preferences
exports.getPreferences = asyncHandler(async (req, res) => {
  return ok(res, req.user.notificationPreferences);
});

// PUT /notifications/preferences
exports.updatePreferences = asyncHandler(async (req, res) => {
  req.user.notificationPreferences = { ...req.user.notificationPreferences.toObject?.() || req.user.notificationPreferences, ...req.body };
  await req.user.save();
  return ok(res, req.user.notificationPreferences, 'Sozlamalar saqlandi');
});
