const Notification = require('../models/Notification');
const socket = require('../socket');

/**
 * Bitta foydalanuvchiga bildirishnoma yaratadi va real-time yuboradi.
 */
async function notifyUser(userId, { title, message, type = 'info', priority = 'low', link = '', batchId = null }) {
  const notification = await Notification.create({
    user: userId,
    title,
    message,
    type,
    priority,
    link,
    batchId,
  });
  socket.emitNewNotification(userId, notification.toJSON());
  return notification;
}

/**
 * Bir nechta foydalanuvchiga (yoki barchaga) ommaviy yuboradi.
 */
async function notifyMany(userIds, data) {
  const batchId = `batch_${Date.now()}`;
  const results = await Promise.all(
    userIds.map((id) => notifyUser(id, { ...data, batchId }))
  );
  return { batchId, count: results.length };
}

module.exports = { notifyUser, notifyMany };
