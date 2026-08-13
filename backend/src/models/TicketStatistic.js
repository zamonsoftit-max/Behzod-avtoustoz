const mongoose = require('mongoose');

/**
 * Foydalanuvchining har bir bilet bo'yicha eng yaxshi natijasi va urinishlar soni.
 */
const ticketStatisticSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    ticket: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', required: true },
    bestScore: { type: Number, default: 0 },
    attempts: { type: Number, default: 0 },
    lastAttemptAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

ticketStatisticSchema.index({ user: 1, ticket: 1 }, { unique: true });

module.exports = mongoose.model('TicketStatistic', ticketStatisticSchema);
