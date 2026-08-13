const Question = require('../../models/Question');
const ApiError = require('../../utils/ApiError');
const asyncHandler = require('../../utils/asyncHandler');
const { ok, created } = require('../../utils/response');
const { getPaging } = require('../../utils/pagination');
const { pick } = require('../../utils/i18n');

/**
 * Multipart form'da maydonlar JSON-string sifatida keladi — xavfsiz parse.
 */
function parseMaybeJson(value, fallback) {
  if (value === undefined || value === null) return fallback;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function buildQuestionPayload(body, file) {
  const payload = {
    question: parseMaybeJson(body.question ?? body.text),
    options: parseMaybeJson(body.options, []),
    topic: body.topic,
    difficulty: body.difficulty || 'medium',
    explanation: parseMaybeJson(body.explanation, { uz: '', 'uz-Cyrl': '', ru: '' }),
  };
  if (body.isActive !== undefined) {
    payload.isActive = body.isActive === true || body.isActive === 'true';
  }
  if (file) payload.imageUrl = `/uploads/questions/${file.filename}`;
  else if (body.imageUrl !== undefined) payload.imageUrl = body.imageUrl;
  return payload;
}

// GET /admin/questions?search=&topic=&difficulty=&page=&limit=
exports.list = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaging(req.query, { maxLimit: 1000 });
  const filter = {};
  if (req.query.topic) filter.topic = req.query.topic;
  if (req.query.difficulty) filter.difficulty = req.query.difficulty;
  if (req.query.search) {
    const rx = new RegExp(req.query.search.trim(), 'i');
    filter.$or = [{ 'question.uz': rx }, { 'question.uz-Cyrl': rx }, { 'question.ru': rx }];
  }

  const [items, total] = await Promise.all([
    Question.find(filter).populate('topic', 'name').sort({ createdAt: -1 }).skip(skip).limit(limit),
    Question.countDocuments(filter),
  ]);

  return res.json({
    success: true,
    data: items,
    pagination: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) },
  });
});

// POST /admin/questions  (multipart: image)
exports.create = asyncHandler(async (req, res) => {
  const payload = buildQuestionPayload(req.body, req.file);

  if (!payload.question || !pick(payload.question)) throw ApiError.badRequest('Savol matni majburiy (kamida o\'zbekcha)');
  if (!payload.topic) throw ApiError.badRequest('Mavzu tanlanishi shart');
  if (!Array.isArray(payload.options) || payload.options.length < 2) throw ApiError.badRequest('Kamida 2 ta variant kerak');
  if (!payload.options.some((o) => o.isCorrect)) throw ApiError.badRequest('Kamida bitta to\'g\'ri javob belgilanishi kerak');

  const question = await Question.create(payload);
  const populated = await question.populate('topic', 'name');
  return created(res, populated, 'Savol qo\'shildi');
});

// PUT /admin/questions/:id  (multipart: image)
exports.update = asyncHandler(async (req, res) => {
  const question = await Question.findById(req.params.id);
  if (!question) throw ApiError.notFound('Savol topilmadi');

  const payload = buildQuestionPayload(req.body, req.file);
  Object.entries(payload).forEach(([k, v]) => {
    if (v !== undefined) question[k] = v;
  });

  await question.save();
  const populated = await question.populate('topic', 'name');
  return ok(res, populated, 'Savol yangilandi');
});

// DELETE /admin/questions/:id
exports.remove = asyncHandler(async (req, res) => {
  const question = await Question.findByIdAndDelete(req.params.id);
  if (!question) throw ApiError.notFound('Savol topilmadi');
  return ok(res, null, 'Savol o\'chirildi');
});
