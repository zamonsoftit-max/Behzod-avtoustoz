/**
 * Async controller'larni o'rab, xatolarni Express error handler'ga uzatadi.
 * router.get('/', asyncHandler(async (req, res) => { ... }))
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;
