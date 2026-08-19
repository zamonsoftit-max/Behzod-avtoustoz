const path = require('path');
const fs = require('fs');
const Topic = require('../../models/Topic');
const Question = require('../../models/Question');
const ApiError = require('../../utils/ApiError');
const asyncHandler = require('../../utils/asyncHandler');
const { ok, created } = require('../../utils/response');
const { uploadRoot } = require('../../middleware/upload');

/**
 * FormData flat formatidan nested object yaratadi:
 * { 'name.uz': 'X', 'name.ru': 'Y' } → { name: { uz: 'X', ru: 'Y' } }
 */
function parseNestedBody(body) {
  const result = {};
  for (const [key, value] of Object.entries(body)) {
    const parts = key.split('.');
    if (parts.length === 2) {
      if (!result[parts[0]]) result[parts[0]] = {};
      result[parts[0]][parts[1]] = value;
    } else {
      result[key] = value;
    }
  }
  return result;
}

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
  const parsed = parseNestedBody(req.body);
  const { name, description, order, isActive } = parsed;

  if (!name || !name.uz || !name.uz.trim()) {
    throw ApiError.badRequest("Mavzu nomi majburiy (kamida o'zbekcha)");
  }

  const topicData = {
    name,
    description: description || {},
    order: order !== undefined && order !== '' ? Number(order) : 0,
    isActive: isActive === 'false' ? false : Boolean(isActive),
  };

  // Rasm fayli yuklangan bo'lsa
  if (req.file) {
    topicData.image = `/uploads/topics/${req.file.filename}`;
  }

  const topic = await Topic.create(topicData);
  return created(res, topic, "Mavzu qo'shildi");
});

// PUT /admin/topics/:id
exports.update = asyncHandler(async (req, res) => {
  const topic = await Topic.findById(req.params.id);
  if (!topic) throw ApiError.notFound('Mavzu topilmadi');

  const parsed = parseNestedBody(req.body);

  if (parsed.name) topic.name = parsed.name;
  if (parsed.description) topic.description = parsed.description;
  if (parsed.order !== undefined && parsed.order !== '') topic.order = Number(parsed.order);
  if (parsed.isActive !== undefined) topic.isActive = parsed.isActive === 'false' ? false : Boolean(parsed.isActive);

  // Rasm fayli yangilangan bo'lsa
  if (req.file) {
    // Eski rasmni o'chirish
    if (topic.image) {
      const oldPath = path.join(uploadRoot, '..', topic.image);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    topic.image = `/uploads/topics/${req.file.filename}`;
  }

  await topic.save();
  return ok(res, topic, 'Mavzu yangilandi');
});

// DELETE /admin/topics/:id
exports.remove = asyncHandler(async (req, res) => {
  const count = await Question.countDocuments({ topic: req.params.id });
  if (count > 0) {
    throw ApiError.badRequest(`Bu mavzuda ${count} ta savol bor. Avval ularni o'chiring yoki ko'chiring.`);
  }
  const topic = await Topic.findByIdAndDelete(req.params.id);
  if (!topic) throw ApiError.notFound('Mavzu topilmadi');

  // Rasmni ham o'chirish
  if (topic.image) {
    const imgPath = path.join(uploadRoot, '..', topic.image);
    if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
  }

  return ok(res, null, "Mavzu o'chirildi");
});
