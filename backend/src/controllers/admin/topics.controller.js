const Topic = require('../../models/Topic');
const Question = require('../../models/Question');
const ApiError = require('../../utils/ApiError');
const asyncHandler = require('../../utils/asyncHandler');
const { ok, created } = require('../../utils/response');
const { pick } = require('../../utils/i18n');

// GET /admin/topics
exports.list = asyncHandler(async (req, res) => {
  const topics = await Topic.find().sort({ order: 1, createdAt: 1 }).lean();
  const counts = await Question.aggregate([{ $group: { _id: '$topic', count: { $sum: 1 } } }]);
  const map = new Map(counts.map((c) => [String(c._id), c.count]));
  const data = topics.map((t) => ({ ...t, questionCount: map.get(String(t._id)) || 0 }));
  return ok(res, data);
});

// POST /admin/topics
exports.create = asyncHandler(async (req, res) => {
  const { name, description, icon, order, isActive } = req.body;
  if (!name || !pick(name)) throw ApiError.badRequest('Mavzu nomi majburiy (kamida o\'zbekcha)');
  const topic = await Topic.create({ name, description, icon, order, isActive });
  return created(res, topic, 'Mavzu qo\'shildi');
});

// PUT /admin/topics/:id
exports.update = asyncHandler(async (req, res) => {
  const topic = await Topic.findById(req.params.id);
  if (!topic) throw ApiError.notFound('Mavzu topilmadi');
  ['name', 'description', 'icon', 'order', 'isActive'].forEach((f) => {
    if (req.body[f] !== undefined) topic[f] = req.body[f];
  });
  await topic.save();
  return ok(res, topic, 'Mavzu yangilandi');
});

// DELETE /admin/topics/:id
exports.remove = asyncHandler(async (req, res) => {
  const count = await Question.countDocuments({ topic: req.params.id });
  if (count > 0) throw ApiError.badRequest(`Bu mavzuda ${count} ta savol bor. Avval ularni o'chiring yoki ko'chiring.`);
  const topic = await Topic.findByIdAndDelete(req.params.id);
  if (!topic) throw ApiError.notFound('Mavzu topilmadi');
  return ok(res, null, 'Mavzu o\'chirildi');
});
