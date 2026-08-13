const mongoose = require('mongoose');
const multiLang = require('./_multiLang');

/**
 * Bilet — imtihon uslubidagi savollar to'plami (odatda 20 ta).
 */
const ticketSchema = new mongoose.Schema(
  {
    number: { type: Number, required: true, unique: true, index: true },
    name: multiLang(), // ixtiyoriy nom; bo'sh bo'lsa "Bilet N"
    questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

ticketSchema.virtual('questionCount').get(function questionCount() {
  return Array.isArray(this.questions) ? this.questions.length : 0;
});

ticketSchema.set('toJSON', { virtuals: true });
ticketSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Ticket', ticketSchema);
