import io from 'socket.io-client';
import store from '../store/store';
import { logout } from '../store/slices/authSlice';
import { 
  addNotification, 
  updateNotificationRead,
  markAllRead 
} from '../store/slices/notificationSlice';
import toast from 'react-hot-toast';

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = null;
  }

  connect() {
    const token = localStorage.getItem('token');
    
    if (!token) {
      console.log('No token, skipping socket connection');
      return;
    }

    const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 
      (process.env.NODE_ENV === 'production' 
        ? window.location.origin 
        : 'http://localhost:5000');

    this.socket = io(SOCKET_URL, {
      auth: {
        token: token
      },
      withCredentials: true,
      transports: ['websocket'], // Use only websocket to avoid upgrade issues
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      upgrade: false, // Disable upgrade
      rememberUpgrade: false
    });

    this.setupEventHandlers();
  }

  setupEventHandlers() {
    // Connection events
    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.connected = true;
      this.reconnectAttempts = 0;
      
      // Clear reconnect interval if exists
      if (this.reconnectInterval) {
        clearInterval(this.reconnectInterval);
        this.reconnectInterval = null;
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      this.connected = false;
      
      // Auto reconnect for client-side disconnections
      if (reason === 'io server disconnect') {
        // Server disconnected, don't auto-reconnect
        console.log('Server initiated disconnect');
      } else if (reason === 'transport close' || reason === 'transport error') {
        // Network issues, try to reconnect
        this.attemptReconnect();
      }
    });

    this.socket.on('connect_error', (error) => {
      // Don't log timeout errors as they are expected
      if (error.type !== 'TransportError' && error.message !== 'timeout') {
        console.error('Socket connection error:', error.message);
      }
      
      // If authentication error, logout user
      if (error.message === 'Authentication error' || error.message === 'Session expired') {
        store.dispatch(logout());
        const lang = localStorage.getItem('language') || 'uz';
        const message = lang === 'uz' ? 'Sessiya muddati tugadi. Qaytadan kiring.' : 
                       lang === 'ru' ? 'Сессия истекла. Войдите снова.' : 
                       'Session expired. Please login again.';
        toast.error(message);
      }
    });

    // Force logout from another device
    this.socket.on('force_logout', (msg) => {
      console.log('Force logout:', msg);
      store.dispatch(logout());
      const lang = localStorage.getItem('language') || 'uz';
      const message = lang === 'uz' ? 'Boshqa qurilmadan kirildi. Qaytadan kiring.' :
                     lang === 'ru' ? 'Вход выполнен с другого устройства. Войдите снова.' :
                     'Logged in from another device. Please login again.';
      toast.error(message);
      this.disconnect();
    });

    // Notifications
    this.socket.on('notification:new', (notification) => {
      console.log('New notification:', notification);
      console.log('Current store state before dispatch:', store.getState().notification);
      // Update notification count in Redux store
      store.dispatch(addNotification(notification));
      // Don't increment count here - addNotification already handles it
      console.log('Store state after dispatch:', store.getState().notification);
      
      // Show toast notification
      const lang = localStorage.getItem('language') || 'uz';
      const message = lang === 'uz' ? 'Sizda yangi bildirishnoma bor' :
                     lang === 'uz-Cyrl' ? 'Сизда янги билдиришнома бор' :
                     lang === 'ru' ? 'У вас есть новое уведомление' :
                     'You have a new notification';
      
      switch (notification.priority) {
        case 'urgent':
        case 'high':
          toast.error(message);
          break;
        case 'medium':
          toast(message, { icon: '⚠️' });
          break;
        default:
          toast.success(message);
      }
    });

    this.socket.on('notification:read', (notificationId) => {
      // Update notification in other tabs/devices
      console.log('Notification marked as read:', notificationId);
      store.dispatch(updateNotificationRead(notificationId));
    });

    this.socket.on('notification:all-read', () => {
      // Update all notifications in other tabs/devices
      console.log('All notifications marked as read');
      store.dispatch(markAllRead());
    });

    this.socket.on('notification:broadcast', (message) => {
      console.log('Broadcast notification:', message);
      toast.info(message);
    });

    // User updates
    this.socket.on('user:updated', (userData) => {
      console.log('User data updated:', userData);
      // Update user data in Redux store
      // You can dispatch an action here to update user data
    });

    // Test events
    this.socket.on('test:time-warning', (data) => {
      const lang = localStorage.getItem('language') || 'uz';
      const message = lang === 'uz' ? `Diqqat! Test tugashiga ${data.minutes} daqiqa qoldi!` :
                     lang === 'ru' ? `Внимание! До конца теста осталось ${data.minutes} минут!` :
                     `Warning! ${data.minutes} minutes left until test ends!`;
      toast.error(message);
    });

    // Subscription events
    this.socket.on('subscription:expiring', (data) => {
      const lang = localStorage.getItem('language') || 'uz';
      const message = lang === 'uz' ? `Obuna muddati ${data.days} kun ichida tugaydi!` :
                     lang === 'ru' ? `Подписка истекает через ${data.days} дней!` :
                     `Subscription expires in ${data.days} days!`;
      toast.error(message);
    });

    this.socket.on('subscription:expired', () => {
      const lang = localStorage.getItem('language') || 'uz';
      const message = lang === 'uz' ? 'Obuna muddati tugadi. Davom etish uchun obunani yangilang.' :
                     lang === 'ru' ? 'Подписка истекла. Обновите подписку для продолжения.' :
                     'Subscription expired. Please renew to continue.';
      toast.error(message);
    });
  }

  // Emit events
  startTest(testData) {
    if (this.socket && this.connected) {
      this.socket.emit('test:start', testData);
    }
  }

  submitTest(testData) {
    if (this.socket && this.connected) {
      this.socket.emit('test:submit', testData);
    }
  }

  markNotificationRead(notificationId) {
    if (this.socket && this.connected) {
      this.socket.emit('notification:mark-read', notificationId);
    }
  }

  markAllNotificationsRead() {
    if (this.socket && this.connected) {
      this.socket.emit('notification:mark-all-read');
    }
  }

  // Admin events
  broadcastMessage(message) {
    if (this.socket && this.connected) {
      this.socket.emit('admin:broadcast', message);
    }
  }

  updateUser(userData) {
    if (this.socket && this.connected) {
      this.socket.emit('admin:update-user', userData);
    }
  }

  // Disconnect
  disconnect() {
    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval);
      this.reconnectInterval = null;
    }
    
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  // Reconnect
  reconnect() {
    this.disconnect();
    this.connect();
  }
  
  // Attempt reconnect with backoff
  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached');
      return;
    }
    
    if (this.reconnectInterval) {
      return; // Already trying to reconnect
    }
    
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    console.log(`Attempting reconnect in ${delay}ms (attempt ${this.reconnectAttempts + 1})`);
    
    this.reconnectInterval = setTimeout(() => {
      this.reconnectAttempts++;
      this.reconnectInterval = null;
      
      if (!this.connected && localStorage.getItem('token')) {
        this.connect();
      }
    }, delay);
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;
