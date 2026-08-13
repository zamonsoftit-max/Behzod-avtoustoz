const { Server } = require('socket.io');
const User = require('../models/User');
const tokenService = require('../services/token.service');
const env = require('../config/env');

let io = null;
// userId -> Set(socketId)
const userSockets = new Map();

function addSocket(userId, socketId) {
  if (!userSockets.has(userId)) userSockets.set(userId, new Set());
  userSockets.get(userId).add(socketId);
}

function removeSocket(userId, socketId) {
  const set = userSockets.get(userId);
  if (!set) return;
  set.delete(socketId);
  if (set.size === 0) userSockets.delete(userId);
}

/**
 * Socket.io serverni ishga tushirish.
 */
function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: env.CLIENT_URL.split(',').map((s) => s.trim()),
      credentials: true,
    },
  });

  // Autentifikatsiya middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication error'));
      const decoded = tokenService.verifyAccessToken(token);
      const user = await User.findById(decoded.id).select('_id role status activeSessionId');
      if (!user) return next(new Error('Authentication error'));
      if (user.status === 'blocked') return next(new Error('Session expired'));
      // Bitta qurilma siyosati
      if (user.activeSessionId && decoded.sid && decoded.sid !== user.activeSessionId) {
        return next(new Error('Session expired'));
      }
      socket.userId = user._id.toString();
      socket.userRole = user.role;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', async (socket) => {
    const { userId } = socket;
    addSocket(userId, socket.id);
    await User.findByIdAndUpdate(userId, { isOnline: true, socketId: socket.id, lastSeenAt: new Date() });
    socket.join(`user:${userId}`);
    if (socket.userRole === 'admin') socket.join('admins');

    socket.on('disconnect', async () => {
      removeSocket(userId, socket.id);
      if (!userSockets.has(userId)) {
        await User.findByIdAndUpdate(userId, { isOnline: false, lastSeenAt: new Date() });
      }
    });

    // Mijoz hodisalari (frontend socket.service.js bilan mos)
    socket.on('notification:mark-read', (notificationId) => {
      socket.to(`user:${userId}`).emit('notification:read', notificationId);
    });
    socket.on('notification:mark-all-read', () => {
      socket.to(`user:${userId}`).emit('notification:all-read');
    });
    socket.on('admin:broadcast', (message) => {
      if (socket.userRole === 'admin') io.emit('notification:broadcast', message);
    });
  });

  console.log('✅ Socket.io ishga tushdi');
  return io;
}

// ===== Controller'lar uchun emit yordamchilari =====

function emitToUser(userId, event, payload) {
  if (io) io.to(`user:${String(userId)}`).emit(event, payload);
}

function emitNewNotification(userId, notification) {
  emitToUser(userId, 'notification:new', notification);
}

function emitToAdmins(event, payload) {
  if (io) io.to('admins').emit(event, payload);
}

function broadcast(event, payload) {
  if (io) io.emit(event, payload);
}

/**
 * Bir foydalanuvchini barcha qurilmalardan majburiy chiqarish.
 */
function forceLogout(userId, message = 'Boshqa qurilmadan kirildi') {
  emitToUser(userId, 'force_logout', message);
}

function getOnlineCount() {
  return userSockets.size;
}

function isUserOnline(userId) {
  return userSockets.has(String(userId));
}

module.exports = {
  initSocket,
  emitToUser,
  emitNewNotification,
  emitToAdmins,
  broadcast,
  forceLogout,
  getOnlineCount,
  isUserOnline,
};
