/**
 * Frontend kutadigan standart javob konvensiyalari.
 *
 *   success:    { success, data, message }
 *   paginated:  { success, data: [...], pagination: { total, page, limit, totalPages } }
 *
 * (Frontend asosan response.data.data va response.data.pagination ni o'qiydi.)
 */

function ok(res, data = null, message, status = 200) {
  const body = { success: true };
  if (data !== undefined) body.data = data;
  if (message) body.message = message;
  return res.status(status).json(body);
}

function created(res, data, message) {
  return ok(res, data, message, 201);
}

function paginated(res, items, { total, page, limit }) {
  const limitNum = Number(limit) || 20;
  return res.status(200).json({
    success: true,
    data: items,
    pagination: {
      total,
      page: Number(page) || 1,
      limit: limitNum,
      totalPages: Math.max(1, Math.ceil(total / limitNum)),
    },
  });
}

module.exports = { ok, created, paginated };
