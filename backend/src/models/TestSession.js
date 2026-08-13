const mongoose = require('mongoose');

/**
 * Boshlangan, lekin hali topshirilmagan test (progress saqlash uchun).
 * /tests/start -> session yaratadi, /tests/:id/progress -> yangilaydi,
 * /tests/:id/submit -> TestResult ga aylantiradi.
 */
const testSessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    testType: {
      type: String,
      enum: ['topic', 'ticket', 'random', 'exam', 'wrong'],
      required: true,
    },
    topic: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', default: null },
    ticket: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', default: null },

    questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],

    // { [questionId]: selectedOptionIndex }
    answers: { type: Map, of: Number, default: {} },
    currentQuestion: { type: Number, default: 0 },

    status: { type: String, enum: ['in-progress', 'completed', 'expired'], default: 'in-progress', index: true },
    startedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date }, // imtihon vaqti tugashi (ixtiyoriy)
  },
  { timestamps: true }
);

module.exports = mongoose.model('TestSession', testSessionSchema);
