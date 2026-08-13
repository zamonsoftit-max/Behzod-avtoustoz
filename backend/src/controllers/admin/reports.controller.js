const User = require('../../models/User');
const TestResult = require('../../models/TestResult');
const Payment = require('../../models/Payment');
const asyncHandler = require('../../utils/asyncHandler');
const { ok } = require('../../utils/response');

function rangeFromQuery(query) {
  const to = query.to ? new Date(query.to) : new Date();
  let from;
  if (query.from) {
    from = new Date(query.from);
  } else {
    const period = query.period || '30d';
    const days = period === '7d' ? 7 : period === '90d' ? 90 : period === '365d' ? 365 : 30;
    from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
  }
  return { from, to };
}

// GET /admin/reports?period=&from=&to=
exports.getReports = asyncHandler(async (req, res) => {
  const { from, to } = rangeFromQuery(req.query);
  const match = { createdAt: { $gte: from, $lte: to } };

  const [
    newUsers,
    testsTaken,
    revenueAgg,
    paymentsCount,
    dailyUsers,
    dailyRevenue,
    testTypeBreakdown,
  ] = await Promise.all([
    User.countDocuments({ role: 'student', ...match }),
    TestResult.countDocuments(match),
    Payment.aggregate([
      { $match: { status: 'completed', paidAt: { $gte: from, $lte: to } } },
      { $group: { _id: null, sum: { $sum: '$amount' } } },
    ]),
    Payment.countDocuments({ status: 'completed', paidAt: { $gte: from, $lte: to } }),
    User.aggregate([
      { $match: { role: 'student', ...match } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Payment.aggregate([
      { $match: { status: 'completed', paidAt: { $gte: from, $lte: to } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$paidAt' } }, sum: { $sum: '$amount' } } },
      { $sort: { _id: 1 } },
    ]),
    TestResult.aggregate([
      { $match: match },
      { $group: { _id: '$testType', count: { $sum: 1 }, avgScore: { $avg: '$percentage' } } },
    ]),
  ]);

  return ok(res, {
    period: { from, to },
    summary: {
      newUsers,
      testsTaken,
      revenue: revenueAgg[0]?.sum || 0,
      payments: paymentsCount,
    },
    charts: {
      dailyUsers: dailyUsers.map((d) => ({ date: d._id, count: d.count })),
      dailyRevenue: dailyRevenue.map((d) => ({ date: d._id, sum: d.sum })),
      testTypes: testTypeBreakdown.map((t) => ({ type: t._id, count: t.count, avgScore: Math.round(t.avgScore || 0) })),
    },
  });
});

// POST /admin/reports/export  — JSON ko'rinishida eksport ma'lumotini qaytaradi
exports.exportReport = asyncHandler(async (req, res) => {
  const { from, to } = rangeFromQuery(req.body);

  const payments = await Payment.find({ status: 'completed', paidAt: { $gte: from, $lte: to } })
    .populate('user', 'firstName lastName phoneNumber')
    .sort({ paidAt: -1 })
    .lean();

  const rows = payments.map((p) => ({
    sana: p.paidAt,
    foydalanuvchi: `${p.user?.firstName || ''} ${p.user?.lastName || ''}`.trim(),
    telefon: p.user?.phoneNumber || '',
    tarif: p.subscriptionType || p.plan,
    summa: p.amount,
    usul: p.paymentMethod,
  }));

  return ok(res, { period: { from, to }, count: rows.length, rows }, 'Hisobot tayyorlandi');
});
