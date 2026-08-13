import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  FiBell, 
  FiCheckCircle, 
  FiAlertCircle, 
  FiInfo,
  FiTrash2,
  FiClock
} from 'react-icons/fi';
import { format } from 'date-fns';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Pagination from '../../components/common/Pagination';
import socketService from '../../services/socket.service';
import toast from 'react-hot-toast';

const NotificationsPage = () => {
  const { t, i18n } = useTranslation();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [unreadCount, setUnreadCount] = useState(0);
  const abortControllerRef = useRef(null);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cancel any pending requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    // Reset to page 1 when filter changes
    setCurrentPage(prevPage => {
      if (filter && prevPage !== 1) {
        return 1;
      }
      return prevPage;
    });
  }, [filter]);

  // Define fetchNotifications first
  const fetchNotifications = useCallback(async () => {
    // Cancel previous request if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    const controller = new AbortController();
    abortControllerRef.current = controller;
    
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 10
      };

      if (filter === 'unread') {
        params.isRead = 'false';
      } else if (filter === 'read') {
        params.isRead = 'true';
      }

      console.log('Fetching notifications with params:', params);

      const response = await api.get('/notifications', { 
        params,
        signal: controller.signal 
      });
      
      console.log('Notifications response:', response.data);
      
      // Validate response
      if (!response?.data) {
        throw new Error('Invalid response format');
      }
      
      // Handle empty data case
      const notificationsData = response.data.data || [];
      
      setNotifications(notificationsData);
      setTotalPages(response.data.pagination?.totalPages || 1);
      setUnreadCount(response.data.unreadCount || 0);
    } catch (error) {
      if (error.name !== 'AbortError' && error.name !== 'CanceledError' && error.code !== 'ERR_CANCELED') {
        console.error('Error fetching notifications:', error);
        // Only show error if it's a real error, not just empty data
        if (error.response?.status && error.response.status >= 500) {
          toast.error('Bildirishnomalarni yuklashda xatolik');
        }
      }
    } finally {
      setLoading(false);
    }
  }, [currentPage, filter]);

  // Fetch notifications on mount and when filters change
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Socket event listener
  useEffect(() => {
    const handleSocketNotification = (notification) => {
      console.log('Socket notification received in NotificationsPage:', notification);
      // Simple approach: just refresh the list
      fetchNotifications();
    };

    // Set up socket listener
    if (socketService?.socket) {
      socketService.socket.on('notification:new', handleSocketNotification);
      console.log('Socket listener set up for notifications');
    }

    // Cleanup
    return () => {
      if (socketService?.socket) {
        socketService.socket.off('notification:new', handleSocketNotification);
      }
    };
  }, [fetchNotifications]);

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => 
        prev.map(notif => 
          notif._id === id ? { ...notif, isRead: true } : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      // Emit socket event for other devices
      if (socketService && socketService.markNotificationRead) {
        socketService.markNotificationRead(id);
      }
    } catch (error) {
      console.error('Error marking as read:', error);
      toast.error("O'qilgan deb belgilashda xatolik");
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/mark-all-read');
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, isRead: true }))
      );
      setUnreadCount(0);
      // Emit socket event for other devices
      if (socketService && socketService.markAllNotificationsRead) {
        socketService.markAllNotificationsRead();
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error("Hammasini o'qilgan deb belgilashda xatolik");
    }
  };

  const deleteNotification = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      const deletedNotif = notifications.find(n => n._id === id);
      setNotifications(prev => prev.filter(notif => notif._id !== id));
      
      // Update unread count if deleted notification was unread
      if (deletedNotif && !deletedNotif.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error("Bildirishnomani o'chirishda xatolik");
    }
  };

  const getNotificationIcon = (type, priority) => {
    if (priority === 'urgent' || priority === 'high') {
      return <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
        <FiAlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
      </div>;
    }
    
    switch (type) {
      case 'payment_confirmed':
        return <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
          <FiCheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
        </div>;
      case 'subscription_warning':
      case 'subscription_expired':
      case 'profile_deletion_warning':
        return <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
          <FiAlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
        </div>;
      default:
        return <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
          <FiInfo className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>;
    }
  };


  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('notifications.title')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {t('notifications.subtitle')}
        </p>
      </div>

      {/* Filter and actions */}
      <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === 'all' 
                  ? 'bg-white dark:bg-dark-card text-primary-600 shadow-sm' 
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              {t('notifications.filter.all')}
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === 'unread' 
                  ? 'bg-white dark:bg-dark-card text-primary-600 shadow-sm' 
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              {t('notifications.filter.unread', { count: unreadCount })}
            </button>
            <button
              onClick={() => setFilter('read')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === 'read' 
                  ? 'bg-white dark:bg-dark-card text-primary-600 shadow-sm' 
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              {t('notifications.filter.read')}
            </button>
          </div>
          
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {t('notifications.markAllAsRead')}
            </button>
          )}
        </div>
      </div>

      {/* Notifications list */}
      <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        {notifications.length === 0 ? (
          <div className="text-center py-12">
            <FiBell className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">{t('notifications.empty')}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">{
          notifications.map(notification => (
            <div
              key={notification._id}
              className={`relative p-6 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer ${
                notification.isRead ? 'opacity-75' : ''
              }`}
              onClick={() => !notification.isRead && markAsRead(notification._id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  {getNotificationIcon(notification.type, notification.priority)}
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {notification.title?.[i18n.language] || notification.title?.uz || notification.title || t('notifications.default_title')}
                      </h3>
                      {!notification.isRead && (
                        <div className="ml-2 w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></div>
                      )}
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      {notification.message?.[i18n.language] || notification.message?.uz || notification.message || ''}
                    </p>
                    <div className="flex items-center mt-3 text-sm text-gray-500 dark:text-gray-400">
                      <FiClock className="w-4 h-4 mr-1" />
                      {(() => {
                        try {
                          return notification.createdAt 
                            ? format(new Date(notification.createdAt), 'dd.MM.yyyy HH:mm')
                            : 'N/A';
                        } catch {
                          return 'N/A';
                        }
                      })()}
                      {notification.priority === 'urgent' && (
                        <span className="ml-3 px-2 py-0.5 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-medium rounded">
                          {t('priority.urgent')}
                        </span>
                      )}
                      {notification.priority === 'high' && (
                        <span className="ml-3 px-2 py-0.5 bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 text-xs font-medium rounded">
                          {t('priority.high')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNotification(notification._id);
                  }}
                  className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all ml-4"
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
          }</div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;