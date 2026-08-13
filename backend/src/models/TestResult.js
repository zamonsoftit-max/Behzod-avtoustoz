const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema(
  {
    question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
    selectedOption: { type: Number, default: null }, // tanlangan variant indeksi (null = javob berilmagan)
    correctOption: { type: Number, default: null },
    isCorrect: { type: Boolean, default: false },
  },
  { _id: false }
);

const testResultSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    testType: {
      type: String,
      enum: ['topic', 'ticket', 'random', 'exam', 'wrong', 'demo'],
      required: true,
      index: true,
    },
    topic: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', default: null },
    ticket: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', default: null },

    answers: [answerSchema],

    totalQuestions: { type: Number, default: 0 },
    correctAnswers: { type: Number, default: 0 },
    wrongAnswers: { type: Number, default: 0 },
    unanswered: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    isPassed: { type: Boolean, default: false },

    timeSpent: { type: Number, default: 0 }, // soniyalarda
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

testResultSchema.index({ user: 1, createdAt: -1 });

testResultSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('TestResult', testResultSchema);
