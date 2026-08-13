const Ticket = require('../../models/Ticket');
const Question = require('../../models/Question');
const ApiError = require('../../utils/ApiError');
const asyncHandler = require('../../utils/asyncHandler');
const { ok, created } = require('../../utils/response');
const { getPaging } = require('../../utils/pagination');

// GET /admin/tickets?page=&limit=
exports.list = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaging(req.query);
  const [items, total] = await Promise.all([
    Ticket.find().sort({ number: 1 }).skip(skip).limit(limit).lean(),
    Ticket.countDocuments(),
  ]);
  const data = items.map((t) => ({ ...t, questionCount: (t.questions || []).length }));
  return res.json({
    success: true,
    data,
    pagination: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) },
  });
});

// POST /admin/tickets  { number, name?, questions: [ids] }
exports.create = asyncHandler(async (req, res) => {
  const { number, name, questions = [], isActive } = req.body;
  if (number == null) throw ApiError.badRequest('Bilet raqami majburiy');
  const exists = await Ticket.findOne({ number });
  if (exists) throw ApiError.badRequest(`${number}-bilet allaqachon mavjud`);
  const ticket = await Ticket.create({ number, name, questions, isActive });
  return created(res, ticket, 'Bilet qo\'shildi');
});

// POST /admin/tickets/generate  { count?, questionsPerTicket? }
// Mavjud savollardan avtomatik biletlar yaratadi.
exports.generate = asyncHandler(async (req, res) => {
  const questionsPerTicket = parseInt(req.body.questionsPerTicket, 10) || 20;
  const requestedCount = parseInt(req.body.count, 10) || 0;

  const allIds = (await Question.find({ isActive: true }).select('_id').lean()).map((q) => q._id);
  if (allIds.length < questionsPerTicket) {
    throw ApiError.badRequest(`Yetarli savol yo'q (kamida ${questionsPerTicket} ta kerak, hozir ${allIds.length} ta)`);
  }

  // Aralashtirish (Fisher-Yates)
  for (let i = allIds.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [allIds[i], allIds[j]] = [allIds[j], allIds[i]];
  }

  const maxByQuestions = Math.floor(allIds.length / questionsPerTicket);
  const ticketsToCreate = requestedCount > 0 ? Math.min(requestedCount, maxByQuestions) : maxByQuestions;

  const lastTicket = await Ticket.findOne().sort({ number: -1 }).select('number');
  let nextNumber = (lastTicket?.number || 0) + 1;

  const docs = [];
  for (let t = 0; t < ticketsToCreate; t += 1) {
    const slice = allIds.slice(t * questionsPerTicket, (t + 1) * questionsPerTicket);
    docs.push({ number: nextNumber, questions: slice, isActive: true });
    nextNumber += 1;
  }

  const createdTickets = await Ticket.insertMany(docs);
  return created(res, { count: createdTickets.length, tickets: createdTickets }, `${createdTickets.length} ta bilet yaratildi`);
});

// PUT /admin/tickets/:id
exports.update = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) throw ApiError.notFound('Bilet topilmadi');
  ['number', 'name', 'questions', 'isActive'].forEach((f) => {
    if (req.body[f] !== undefined) ticket[f] = req.body[f];
  });
  await ticket.save();
  return ok(res, ticket, 'Bilet yangilandi');
});

// DELETE /admin/tickets/:id
exports.remove = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findByIdAndDelete(req.params.id);
  if (!ticket) throw ApiError.notFound('Bilet topilmadi');
  return ok(res, null, 'Bilet o\'chirildi');
});

// GET /admin/tickets/:id/questions — bilet savollari (tahrirlash uchun)
exports.getQuestions = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id).populate('questions');
  if (!ticket) throw ApiError.notFound('Bilet topilmadi');
  return ok(res, ticket.questions);
});
