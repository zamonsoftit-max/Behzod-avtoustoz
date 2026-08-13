/**
 * Ko'p tilli matn maydoni uchun sub-schema shakli: { uz, 'uz-Cyrl', ru }.
 * required=true bo'lsa kamida 'uz' to'ldirilishi shart.
 */
function multiLang({ required = false } = {}) {
  return {
    uz: { type: String, default: '', trim: true, required: required ? true : false },
    'uz-Cyrl': { type: String, default: '', trim: true },
    ru: { type: String, default: '', trim: true },
  };
}

module.exports = multiLang;
