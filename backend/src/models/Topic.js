const mongoose = require('mongoose');
const multiLang = require('./_multiLang');

const topicSchema = new mongoose.Schema(
  {
    name: multiLang({ required: true }),
    description: multiLang(),
    icon: { type: String, default: '' },
    order: { type: Number, default: 0, index: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

topicSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Topic', topicSchema);
