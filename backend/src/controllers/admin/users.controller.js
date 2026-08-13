const User = require('../../models/User');
const TestResult = require('../../models/TestResult');
const Payment = require('../../models/Payment');
const ApiError = require('../../utils/ApiError');
const asyncHandler = require('../../utils/asyncHandler');
const { ok } = require('../../utils/response');
const { getPaging } = require('../../utils/pagination');
const socket = require('../../socket');

// GET /admin/users?search=&status=&role=&page=&limit=
exports.list = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaging(req.query);
  const filter = {};
  if (req.query.search) {
    const rx = new RegExp(req.query.search.trim(), 'i');
    filter.$or = [{ firstName: rx }, { lastName: rx }, { phoneNumber: rx }];
  }
  if (req.query.status) filter.status = req.query.status;
  if (req.query.role) filter.role = req.query.role;
  if (req.query.subscription === 'active') {
    filter['subscription.isActive'] = true;
    filter['subscription.endDate'] = { $gt: new Date() };
  }

  const [items, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  const data = items.map((u) => ({ ...u.toJSON(), isOnline: socket.isUserOnline(u._id) }));
  return res.json({
    success: true,
    data,
    pagination: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) },
  });
});

// GET /admin/users/:id
exports.getOne = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('Foydalanuvchi topilmadi');

  const [testResults, payments, testCount] = await Promise.all([
    TestResult.find({ user: user._id }).sort({ createdAt: -1 }).limit(10).populate('topic', 'name'),
    Payment.find({ user: user._id }).sort({ createdAt: -1 }).limit(10),
    TestResult.countDocuments({ user: user._id }),
  ]);

  // Frontend data.user ni kutadi; qolgan maydonlarni ham beramiz
  return ok(res, {
    user: { ...user.toJSON(), isOnline: socket.isUserOnline(user._id) },
    statistics: { testCount },
    testResults,
    payments,
  });
});

// PUT /admin/users/:id
exports.update = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('Foydalanuvchi topilmadi');

  const allowed = ['firstName', 'lastName', 'role', 'status', 'language', 'theme'];
  allowed.forEach((f) => {
    if (req.body[f] !== undefined) user[f] = req.body[f];
  });

  // Obunani qo'lda boshqarish
  if (req.body.subscription) {
    user.subscription = { ...user.subscription.toObject(), ...req.body.subscription };
  }

  await user.save();
  return ok(res, { user: user.toJSON() }, 'Foydalanuvchi yangilandi');
});

// PUT /admin/users/:id/status  { status }
exports.updateStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['active', 'blocked'].includes(status)) throw ApiError.badRequest('Holat noto\'g\'ri');
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('Foydalanuvchi topilmadi');

  user.status = status;
  if (status === 'blocked') {
    user.activeSessionId = null;
    socket.forceLogout(user._id, 'Hisobingiz bloklandi');
  }
  await user.save();
  return ok(res, { user: user.toJSON() }, status === 'blocked' ? 'Foydalanuvchi bloklandi' : 'Foydalanuvchi faollashtirildi');
});

// POST /admin/users/:id/reset-password  — yangi tasodifiy parol yaratadi
exports.resetPassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('Foydalanuvchi topilmadi');

  const newPassword = Math.random().toString(36).slice(-8) + 'A1';
  user.password = newPassword;
  user.activeSessionId = null;
  await user.save();

  return ok(res, { newPassword }, 'Parol tiklandi');
});

// DELETE /admin/users/:id
exports.remove = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('Foydalanuvchi topilmadi');
  if (user.role === 'admin') throw ApiError.badRequest('Admin hisobini o\'chirib bo\'lmaydi');

  await TestResult.deleteMany({ user: user._id });
  await user.deleteOne();
  return ok(res, null, 'Foydalanuvchi o\'chirildi');
});
