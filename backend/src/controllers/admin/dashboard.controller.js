const User = require('../../models/User');
const Question = require('../../models/Question');
const Topic = require('../../models/Topic');
const Ticket = require('../../models/Ticket');
const TestResult = require('../../models/TestResult');
const Payment = require('../../models/Payment');
const asyncHandler = require('../../utils/asyncHandler');
const { ok } = require('../../utils/response');
const socket = require('../../socket');

// GET /admin/dashboard/stats
exports.getStats = asyncHandler(async (req, res) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const last30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    newUsersThisMonth,
    activeSubscriptions,
    totalQuestions,
    totalTopics,
    totalTickets,
    totalTests,
    testsLast30,
    paidPayments,
    monthlyPayments,
    recentUsers,
    recentPayments,
  ] = await Promise.all([
    User.countDocuments({ role: 'student' }),
    User.countDocuments({ role: 'student', createdAt: { $gte: startOfMonth } }),
    User.countDocuments({ 'subscription.isActive': true, 'subscription.endDate': { $gt: now } }),
    Question.countDocuments({ isActive: true }),
    Topic.countDocuments({ isActive: true }),
    Ticket.countDocuments({ isActive: true }),
    TestResult.countDocuments(),
    TestResult.countDocuments({ createdAt: { $gte: last30 } }),
    Payment.aggregate([{ $match: { status: 'completed' } }, { $group: { _id: null, sum: { $sum: '$amount' } } }]),
    Payment.aggregate([
      { $match: { status: 'completed', paidAt: { $gte: startOfMonth } } },
      { $group: { _id: null, sum: { $sum: '$amount' } } },
    ]),
    User.find({ role: 'student' }).sort({ createdAt: -1 }).limit(5).select('firstName lastName phoneNumber createdAt'),
    Payment.find({ status: 'completed' }).sort({ paidAt: -1 }).limit(5).populate('user', 'firstName lastName phoneNumber'),
  ]);

  const totalRevenue = paidPayments[0]?.sum || 0;
  const monthlyRevenue = monthlyPayments[0]?.sum || 0;

  return ok(res, {
    // Tekis maydonlar (frontend ba'zilarini to'g'ridan-to'g'ri o'qiydi)
    totalUsers,
    newUsers: newUsersThisMonth,
    activeSubscriptions,
    onlineNow: socket.getOnlineCount(),
    revenue: totalRevenue,
    monthlyRevenue,

    // Guruhlangan maydonlar
    users: {
      total: totalUsers,
      newThisMonth: newUsersThisMonth,
      activeSubscriptions,
      onlineNow: socket.getOnlineCount(),
    },
    content: {
      questions: totalQuestions,
      topics: totalTopics,
      tickets: totalTickets,
    },
    tests: {
      total: totalTests,
      last30Days: testsLast30,
    },
    recent: {
      users: recentUsers,
      payments: recentPayments,
    },
  });
});
