const mongoose = require('mongoose');
const Topic = require('../models/Topic');
const Ticket = require('../models/Ticket');
const Question = require('../models/Question');
const TestResult = require('../models/TestResult');
const TestSession = require('../models/TestSession');
const TicketStatistic = require('../models/TicketStatistic');
const Settings = require('../models/Settings');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/response');
const { getPaging } = require('../utils/pagination');

const QUESTION_FIELDS = 'question text options topic difficulty explanation imageUrl';

/**
 * Foydalanuvchi javoblarini Map(questionId -> selectedIndex) ko'rinishiga keltiradi.
 * Qabul qilinadi: array of {questionId, selectedOption|selectedAnswer} yoki { [id]: index }.
 */
function normalizeAnswers(input) {
  const map = new Map();
  if (!input) return map;
  if (Array.isArray(input)) {
    input.forEach((a) => {
      const qid = a.questionId || a.question || a._id;
      const sel = a.selectedOption ?? a.selectedAnswer ?? a.answer ?? a.selected;
      if (qid != null) map.set(String(qid), sel == null ? null : Number(sel));
    });
  } else if (typeof input === 'object') {
    Object.entries(input).forEach(([qid, sel]) => {
      map.set(String(qid), sel == null ? null : Number(sel));
    });
  }
  return map;
}

/**
 * Savollar ro'yxati va javoblar asosida natijani hisoblaydi.
 */
async function grade(questions, answersInput, testType) {
  const answerMap = normalizeAnswers(answersInput);
  const settings = await Settings.getSingleton();
  const maxMistakes = settings.examSettings.maxMistakes ?? 2;

  let correct = 0;
  let wrong = 0;
  let unanswered = 0;

  const answers = questions.map((q) => {
    const correctOption = q.options.findIndex((o) => o.isCorrect);
    const selected = answerMap.has(String(q._id)) ? answerMap.get(String(q._id)) : null;
    let isCorrect = false;
    if (selected == null || Number.isNaN(selected)) {
      unanswered += 1;
    } else if (selected === correctOption) {
      isCorrect = true;
      correct += 1;
    } else {
      wrong += 1;
    }
    return { question: q._id, selectedOption: selected, correctOption, isCorrect };
  });

  const totalQuestions = questions.length;
  const percentage = totalQuestions ? Math.round((correct / totalQuestions) * 100) : 0;
  const isExamLike = ['exam', 'ticket'].includes(testType);
  const isPassed = isExamLike ? wrong <= maxMistakes : percentage >= 90;

  return { answers, totalQuestions, correctAnswers: correct, wrongAnswers: wrong, unanswered, percentage, isPassed };
}

// ===== Mavzu / Bilet ro'yxatlari =====

// GET /tests/topics
exports.getTopics = asyncHandler(async (req, res) => {
  const topics = await Topic.find({ isActive: true }).sort({ order: 1, createdAt: 1 }).lean();
  const counts = await Question.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: '$topic', count: { $sum: 1 } } },
  ]);
  const countMap = new Map(counts.map((c) => [String(c._id), c.count]));
  const data = topics.map((t) => ({ ...t, questionCount: countMap.get(String(t._id)) || 0 }));
  return ok(res, data);
});

// GET /tests/tickets
exports.getTickets = asyncHandler(async (req, res) => {
  const tickets = await Ticket.find({ isActive: true }).sort({ number: 1 }).lean();
  const data = tickets.map((t) => ({
    _id: t._id,
    number: t.number,
    name: t.name,
    questionCount: (t.questions || []).length,
  }));
  return ok(res, data);
});

// ===== Savollar olish =====

// GET /tests/questions/topic/:topicId
exports.getQuestionsByTopic = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  const questions = await Question.aggregate([
    { $match: { topic: new mongoose.Types.ObjectId(req.params.topicId), isActive: true } },
    { $sample: { size: limit } },
  ]);
  if (!questions.length) throw ApiError.notFound('Bu mavzu uchun savollar topilmadi');
  return ok(res, questions);
});

// GET /tests/questions/ticket/:ticketId
exports.getQuestionsByTicket = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.ticketId).populate({
    path: 'questions',
    match: { isActive: true },
    select: QUESTION_FIELDS,
    populate: { path: 'topic', select: 'name' },
  });
  if (!ticket) throw ApiError.notFound('Bilet topilmadi');
  return ok(res, ticket.questions);
});

// GET /tests/questions/random?count
exports.getRandomQuestions = asyncHandler(async (req, res) => {
  const count = Math.min(parseInt(req.query.count, 10) || 20, 100);
  const questions = await Question.aggregate([
    { $match: { isActive: true } },
    { $sample: { size: count } },
  ]);
  return ok(res, questions);
});

// GET /tests/questions/exam
exports.getExamQuestions = asyncHandler(async (req, res) => {
  const settings = await Settings.getSingleton();
  const count = settings.examSettings.questionCount || 20;
  const questions = await Question.aggregate([
    { $match: { isActive: true } },
    { $sample: { size: count } },
  ]);
  return ok(res, questions);
});

// GET /tests/questions/wrong?all
exports.getWrongQuestions = asyncHandler(async (req, res) => {
  const all = req.query.all === 'true' || req.query.all === true;
  const results = await TestResult.find({ user: req.user._id }).select('answers').lean();

  const wrongIds = new Set();
  results.forEach((r) => {
    (r.answers || []).forEach((a) => {
      if (!a.isCorrect && a.question) wrongIds.add(String(a.question));
    });
  });

  let ids = Array.from(wrongIds);
  if (!all) ids = ids.slice(0, 50);

  const questions = await Question.find({ _id: { $in: ids }, isActive: true })
    .select(QUESTION_FIELDS)
    .populate('topic', 'name');
  return ok(res, questions);
});

// ===== Demo (ochiq) =====

// GET /tests/demo/questions
exports.getDemoQuestions = asyncHandler(async (req, res) => {
  const settings = await Settings.getSingleton();
  const count = settings.demoSettings.questionCount || 10;
  const questions = await Question.aggregate([
    { $match: { isActive: true } },
    { $sample: { size: count } },
  ]);
  return ok(res, questions);
});

// POST /tests/demo/submit  { answers, questions? }
exports.submitDemo = asyncHandler(async (req, res) => {
  const { answers, questionIds } = req.body;
  const ids = questionIds || (Array.isArray(answers) ? answers.map((a) => a.questionId || a.question) : Object.keys(answers || {}));
  const questions = await Question.find({ _id: { $in: ids } }).select('question text options explanation');
  const result = await grade(questions, answers, 'demo');
  // Demo natijasi saqlanmaydi (foydalanuvchi tizimga kirmagan)
  return ok(res, { ...result, questions });
});

// ===== Sessiyaga asoslangan test oqimi =====

// POST /tests/start  { testType, topicId?, ticketId?, count? }
exports.startTest = asyncHandler(async (req, res) => {
  const { testType, topicId, ticketId, count } = req.body;
  let questions = [];
  let topic = null;
  let ticket = null;

  if (testType === 'topic') {
    topic = topicId;
    questions = await Question.aggregate([
      { $match: { topic: new mongoose.Types.ObjectId(topicId), isActive: true } },
      { $sample: { size: Math.min(parseInt(count, 10) || 20, 100) } },
    ]);
  } else if (testType === 'ticket') {
    ticket = ticketId;
    const t = await Ticket.findById(ticketId).populate({ path: 'questions', match: { isActive: true } });
    if (!t) throw ApiError.notFound('Bilet topilmadi');
    questions = t.questions;
  } else if (testType === 'exam') {
    const settings = await Settings.getSingleton();
    questions = await Question.aggregate([
      { $match: { isActive: true } },
      { $sample: { size: settings.examSettings.questionCount || 20 } },
    ]);
  } else {
    // random / wrong
    questions = await Question.aggregate([
      { $match: { isActive: true } },
      { $sample: { size: Math.min(parseInt(count, 10) || 20, 100) } },
    ]);
  }

  if (!questions.length) throw ApiError.notFound('Savollar topilmadi');

  const session = await TestSession.create({
    user: req.user._id,
    testType,
    topic,
    ticket,
    questions: questions.map((q) => q._id),
  });

  return ok(res, { testId: session._id, questions, testType }, 'Test boshlandi');
});

// PUT /tests/:testId/progress  { answers, currentQuestion }
exports.saveProgress = asyncHandler(async (req, res) => {
  const session = await TestSession.findOne({ _id: req.params.testId, user: req.user._id });
  if (!session) throw ApiError.notFound('Test sessiyasi topilmadi');
  if (req.body.answers) {
    const map = normalizeAnswers(req.body.answers);
    session.answers = Object.fromEntries(map);
  }
  if (req.body.currentQuestion != null) session.currentQuestion = req.body.currentQuestion;
  await session.save();
  return ok(res, { saved: true });
});

// GET /tests/:testId/progress
exports.getProgress = asyncHandler(async (req, res) => {
  const session = await TestSession.findOne({ _id: req.params.testId, user: req.user._id });
  if (!session) throw ApiError.notFound('Test sessiyasi topilmadi');
  return ok(res, {
    answers: Object.fromEntries(session.answers || new Map()),
    currentQuestion: session.currentQuestion,
    status: session.status,
  });
});

// POST /tests/:testId/submit  { answers, timeSpent? }
exports.submitSession = asyncHandler(async (req, res) => {
  const session = await TestSession.findOne({ _id: req.params.testId, user: req.user._id });
  if (!session) throw ApiError.notFound('Test sessiyasi topilmadi');
  if (session.status === 'completed') throw ApiError.badRequest('Bu test allaqachon topshirilgan');

  const questions = await Question.find({ _id: { $in: session.questions } });
  const graded = await grade(questions, req.body.answers, session.testType);

  const result = await TestResult.create({
    user: req.user._id,
    testType: session.testType,
    topic: session.topic,
    ticket: session.ticket,
    ...graded,
    timeSpent: req.body.timeSpent || 0,
    startedAt: session.startedAt,
    completedAt: new Date(),
  });

  session.status = 'completed';
  await session.save();

  await updateTicketStat(req.user._id, session.ticket, graded.percentage);

  return ok(res, { testId: result._id, resultId: result._id, ...graded }, 'Test topshirildi');
});

// POST /tests/submit  { testType, answers, questionIds?, topicId?, ticketId?, timeSpent? }
exports.submitTest = asyncHandler(async (req, res) => {
  const { testType = 'random', answers, questionIds, topicId, ticketId, timeSpent } = req.body;
  const ids = questionIds || (Array.isArray(answers) ? answers.map((a) => a.questionId || a.question) : Object.keys(answers || {}));
  if (!ids || !ids.length) throw ApiError.badRequest('Javoblar yuborilmadi');

  const questions = await Question.find({ _id: { $in: ids } });
  const graded = await grade(questions, answers, testType);

  const result = await TestResult.create({
    user: req.user._id,
    testType,
    topic: topicId || null,
    ticket: ticketId || null,
    ...graded,
    timeSpent: timeSpent || 0,
    completedAt: new Date(),
  });

  await updateTicketStat(req.user._id, ticketId, graded.percentage);

  return ok(res, { testId: result._id, resultId: result._id, ...graded }, 'Test topshirildi');
});

async function updateTicketStat(userId, ticketId, percentage) {
  if (!ticketId) return;
  const stat = await TicketStatistic.findOne({ user: userId, ticket: ticketId });
  if (stat) {
    stat.attempts += 1;
    stat.bestScore = Math.max(stat.bestScore, percentage);
    stat.lastAttemptAt = new Date();
    await stat.save();
  } else {
    await TicketStatistic.create({ user: userId, ticket: ticketId, attempts: 1, bestScore: percentage });
  }
}

// ===== Natijalar =====

// GET /tests/results
exports.getResults = asyncHandler(async (req, res) => {
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

// GET /tests/results/:id
exports.getResultById = asyncHandler(async (req, res) => {
  const result = await TestResult.findOne({ _id: req.params.id, user: req.user._id })
    .populate('topic', 'name')
    .populate('ticket', 'number name')
    .populate({ path: 'answers.question', select: 'question text options explanation imageUrl topic' });
  if (!result) throw ApiError.notFound('Natija topilmadi');

  // Frontend qulayligi uchun questions massivini ham beramiz
  const obj = result.toJSON();
  obj.questions = (result.answers || []).map((a) => ({
    ...(a.question ? a.question.toJSON() : {}),
    selectedOption: a.selectedOption,
    correctOption: a.correctOption,
    isCorrect: a.isCorrect,
  }));
  return ok(res, obj);
});

// ===== Bilet statistikasi =====

// POST /tests/ticket-statistics  { ticketId, bestScore, attempts }
exports.saveTicketStatistics = asyncHandler(async (req, res) => {
  const { ticketId, bestScore = 0, attempts = 1 } = req.body;
  if (!ticketId) throw ApiError.badRequest('ticketId majburiy');
  const stat = await TicketStatistic.findOneAndUpdate(
    { user: req.user._id, ticket: ticketId },
    {
      $max: { bestScore },
      $inc: { attempts },
      $set: { lastAttemptAt: new Date() },
    },
    { upsert: true, new: true }
  );
  return ok(res, stat);
});

// GET /tests/ticket-statistics
exports.getTicketStatistics = asyncHandler(async (req, res) => {
  const stats = await TicketStatistic.find({ user: req.user._id }).populate('ticket', 'number name');
  return ok(res, stats);
});
