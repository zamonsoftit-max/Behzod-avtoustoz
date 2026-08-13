const Payment = require('../../models/Payment');
const ApiError = require('../../utils/ApiError');
const asyncHandler = require('../../utils/asyncHandler');
const { ok } = require('../../utils/response');
const { getPaging } = require('../../utils/pagination');
const { activateSubscription } = require('../../services/subscription.service');

// GET /admin/payments?status=&method=&search=&page=&limit=
exports.list = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaging(req.query);
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.method) filter.paymentMethod = req.query.method;

  const query = Payment.find(filter).populate('user', 'firstName lastName phoneNumber');
  if (req.query.search) {
    // user bo'yicha qidiruv populate'dan keyin filtrlanadi (oddiy yondashuv)
  }

  const [items, total] = await Promise.all([
    query.sort({ createdAt: -1 }).skip(skip).limit(limit),
    Payment.countDocuments(filter),
  ]);

  return res.json({
    success: true,
    data: items,
    pagination: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) },
  });
});

// GET /admin/payments/stats
exports.stats = asyncHandler(async (req, res) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [byStatus, totalRevenue, monthRevenue, byMethod] = await Promise.all([
    Payment.aggregate([{ $group: { _id: '$status', count: { $sum: 1 }, sum: { $sum: '$amount' } } }]),
    Payment.aggregate([{ $match: { status: 'completed' } }, { $group: { _id: null, sum: { $sum: '$amount' } } }]),
    Payment.aggregate([
      { $match: { status: 'completed', paidAt: { $gte: startOfMonth } } },
      { $group: { _id: null, sum: { $sum: '$amount' } } },
    ]),
    Payment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: '$paymentMethod', count: { $sum: 1 }, sum: { $sum: '$amount' } } },
    ]),
  ]);

  const statusMap = {};
  byStatus.forEach((s) => { statusMap[s._id] = { count: s.count, sum: s.sum }; });

  return ok(res, {
    totalRevenue: totalRevenue[0]?.sum || 0,
    monthlyRevenue: monthRevenue[0]?.sum || 0,
    completed: statusMap.completed?.count || 0,
    pending: statusMap.pending?.count || 0,
    cancelled: statusMap.cancelled?.count || 0,
    refunded: statusMap.refunded?.count || 0,
    byStatus: statusMap,
    byMethod,
  });
});

// PUT /admin/payments/:paymentId/confirm — qo'lda tasdiqlash
exports.confirm = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.paymentId);
  if (!payment) throw ApiError.notFound('To\'lov topilmadi');
  if (payment.status === 'completed') throw ApiError.badRequest('To\'lov allaqachon tasdiqlangan');

  payment.providerTransId = payment.providerTransId || `MANUAL-${Date.now()}`;
  await activateSubscription(payment);
  return ok(res, payment, 'To\'lov tasdiqlandi va obuna faollashtirildi');
});

// POST /admin/payments/:paymentId/refund
exports.refund = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.paymentId);
  if (!payment) throw ApiError.notFound('To\'lov topilmadi');
  if (payment.status !== 'completed') throw ApiError.badRequest('Faqat to\'langan to\'lovni qaytarish mumkin');

  payment.status = 'refunded';
  payment.meta = { ...payment.meta, refundReason: req.body.reason || '', refundedAt: new Date() };
  await payment.save();
  return ok(res, payment, 'To\'lov qaytarildi');
});
