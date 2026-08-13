const mongoose = require('mongoose');
const multiLang = require('./_multiLang');

const optionSchema = new mongoose.Schema(
  {
    text: multiLang({ required: true }),
    isCorrect: { type: Boolean, default: false },
  },
  { _id: true }
);

const questionSchema = new mongoose.Schema(
  {
    // Frontend "question" yoki "text" deb o'qiydi — ikkalasini ham beramiz (virtual orqali).
    question: multiLang({ required: true }),
    options: {
      type: [optionSchema],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length >= 2,
        message: 'Kamida 2 ta variant bo\'lishi kerak',
      },
    },
    topic: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', required: true, index: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium', index: true },
    explanation: multiLang(),
    imageUrl: { type: String, default: '' },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

// Frontend ba'zi joyda question.text ni kutadi
questionSchema.virtual('text').get(function getText() {
  return this.question;
});

questionSchema.set('toJSON', { virtuals: true });
questionSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Question', questionSchema);
