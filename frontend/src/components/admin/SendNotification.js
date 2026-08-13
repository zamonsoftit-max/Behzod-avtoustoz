import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiSend, FiX } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../services/api';

const SendNotification = ({ isOpen, onClose, selectedUsers = [] }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: {
      uz: '',
      'uz-Cyrl': '',
      ru: ''
    },
    message: {
      uz: '',
      'uz-Cyrl': '',
      ru: ''
    },
    priority: 'medium',
    allUsers: selectedUsers.length === 0
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate
    if (!formData.title.uz || !formData.message.uz) {
      toast.error('O\'zbek tilida sarlavha va xabar kiritilishi shart');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        title: formData.title,
        message: formData.message,
        priority: formData.priority,
        allUsers: formData.allUsers
      };

      if (!formData.allUsers && selectedUsers.length > 0) {
        payload.userIds = selectedUsers;
      }

      await api.post('/admin/notifications/bulk', payload);
      toast.success('Bildirishnoma muvaffaqiyatli yuborildi');
      onClose();
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: {
        uz: '',
        'uz-Cyrl': '',
        ru: ''
      },
      message: {
        uz: '',
        'uz-Cyrl': '',
        ru: ''
      },
      priority: 'medium',
      allUsers: selectedUsers.length === 0
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">{t('admin.notifications.sendBulk')}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Recipients */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">
                {t('admin.notifications.recipients')}
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={formData.allUsers}
                    onChange={() => setFormData({ ...formData, allUsers: true })}
                    className="mr-2"
                  />
                  <span>{t('admin.notifications.allUsers')}</span>
                </label>
                {selectedUsers.length > 0 && (
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={!formData.allUsers}
                      onChange={() => setFormData({ ...formData, allUsers: false })}
                      className="mr-2"
                    />
                    <span>
                      {t('admin.notifications.selectedUsers', { count: selectedUsers.length })}
                    </span>
                  </label>
                )}
              </div>
            </div>

            {/* Priority */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">
                {t('admin.notifications.priority')}
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">{t('common.priority.low')}</option>
                <option value="medium">{t('common.priority.medium')}</option>
                <option value="high">{t('common.priority.high')}</option>
                <option value="urgent">{t('common.priority.urgent')}</option>
              </select>
            </div>

            {/* Title */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">{t('admin.notifications.title')}</h3>
              
              {/* Uzbek */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  O'zbekcha (lotin)
                </label>
                <input
                  type="text"
                  value={formData.title.uz}
                  onChange={(e) => setFormData({
                    ...formData,
                    title: { ...formData.title, uz: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Sarlavha..."
                  required
                />
              </div>

              {/* Uzbek Cyrillic */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Ўзбекча (кирилл)
                </label>
                <input
                  type="text"
                  value={formData.title['uz-Cyrl']}
                  onChange={(e) => setFormData({
                    ...formData,
                    title: { ...formData.title, 'uz-Cyrl': e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Сарлавҳа..."
                />
              </div>

              {/* Russian */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Русский
                </label>
                <input
                  type="text"
                  value={formData.title.ru}
                  onChange={(e) => setFormData({
                    ...formData,
                    title: { ...formData.title, ru: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Заголовок..."
                />
              </div>
            </div>

            {/* Message */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">{t('admin.notifications.message')}</h3>
              
              {/* Uzbek */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  O'zbekcha (lotin)
                </label>
                <textarea
                  value={formData.message.uz}
                  onChange={(e) => setFormData({
                    ...formData,
                    message: { ...formData.message, uz: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Xabar matni..."
                  rows="3"
                  required
                />
              </div>

              {/* Uzbek Cyrillic */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Ўзбекча (кирилл)
                </label>
                <textarea
                  value={formData.message['uz-Cyrl']}
                  onChange={(e) => setFormData({
                    ...formData,
                    message: { ...formData.message, 'uz-Cyrl': e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Хабар матни..."
                  rows="3"
                />
              </div>

              {/* Russian */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Русский
                </label>
                <textarea
                  value={formData.message.ru}
                  onChange={(e) => setFormData({
                    ...formData,
                    message: { ...formData.message, ru: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Текст сообщения..."
                  rows="3"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={loading}
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center"
                disabled={loading}
              >
                <FiSend className="mr-2" />
                {loading ? t('common.sending') : t('common.send')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SendNotification;