const SUPPORTED = ['uz', 'uz-Cyrl', 'ru'];
const DEFAULT_LANG = 'uz';

/**
 * Accept-Language sarlavhasidan qo'llab-quvvatlanadigan tilni aniqlaydi.
 */
function resolveLang(header) {
  if (!header) return DEFAULT_LANG;
  const raw = String(header).split(',')[0].trim();
  if (SUPPORTED.includes(raw)) return raw;
  // uz-cyrl, uz_Cyrl kabi variantlar
  const lower = raw.toLowerCase();
  if (lower.startsWith('uz-cyrl') || lower.startsWith('uz_cyrl')) return 'uz-Cyrl';
  if (lower.startsWith('ru')) return 'ru';
  if (lower.startsWith('uz')) return 'uz';
  return DEFAULT_LANG;
}

/**
 * Ko'p tilli {uz, 'uz-Cyrl', ru} obyektdan berilgan til matnini oladi.
 * Fallback: tanlangan til -> uz -> birinchi bo'sh bo'lmagan qiymat.
 */
function pick(multi, lang = DEFAULT_LANG) {
  if (multi == null) return '';
  if (typeof multi === 'string') return multi;
  if (typeof multi !== 'object') return String(multi);
  return (
    multi[lang] ||
    multi[DEFAULT_LANG] ||
    multi.uz ||
    multi.ru ||
    Object.values(multi).find((v) => typeof v === 'string' && v.trim()) ||
    ''
  );
}

module.exports = { SUPPORTED, DEFAULT_LANG, resolveLang, pick };
