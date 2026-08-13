/**
 * req.query dan page/limit ni xavfsiz o'qiydi.
 */
function getPaging(query, { defaultLimit = 20, maxLimit = 200 } = {}) {
  let page = parseInt(query.page, 10) || 1;
  let limit = parseInt(query.limit, 10) || defaultLimit;
  if (page < 1) page = 1;
  if (limit < 1) limit = defaultLimit;
  if (limit > maxLimit) limit = maxLimit;
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

module.exports = { getPaging };
