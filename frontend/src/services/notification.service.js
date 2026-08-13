import api from './api';

class NotificationService {
  // Get all notifications
  async getNotifications(params = {}) {
    const response = await api.get('/notifications', { params });
    return response.data;
  }

  // Get unread count
  async getUnreadCount() {
    const response = await api.get('/notifications/unread-count');
    return response.data;
  }

  // Mark notification as read
  async markAsRead(notificationId) {
    const response = await api.put(`/notifications/${notificationId}/read`);
    return response.data;
  }

  // Mark all as read
  async markAllAsRead() {
    const response = await api.put('/notifications/mark-all-read');
    return response.data;
  }

  // Delete notification
  async deleteNotification(notificationId) {
    const response = await api.delete(`/notifications/${notificationId}`);
    return response.data;
  }

  // Clear all notifications
  async clearAll() {
    const response = await api.delete('/notifications/clear-all');
    return response.data;
  }

  // Update notification preferences
  async updatePreferences(preferences) {
    const response = await api.put('/notifications/preferences', preferences);
    return response.data;
  }

  // Get notification preferences
  async getPreferences() {
    const response = await api.get('/notifications/preferences');
    return response.data;
  }
}

export default new NotificationService();