import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  FiDollarSign,
  FiClock,
  FiBell,
  FiPhone,
  FiMail,
  FiMapPin,
  FiSave,
  FiPercent,
  FiTrash2,
  FiAlertCircle,
  FiSend,
  FiInstagram,
  FiLink,
} from 'react-icons/fi';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const SettingsPage = () => {
  const { t } = useTranslation();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('subscription');
  const [showBulkNotification, setShowBulkNotification] = useState(false);
  const [bulkNotification, setBulkNotification] = useState({
    title: { uz: '', 'uz-Cyrl': '', ru: '' },
    message: { uz: '', 'uz-Cyrl': '', ru: '' },
    priority: 'medium',
    allUsers: true,
  });

  useEffect(() => {
    fetchSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/settings');
      setSettings(response.data.data);
    } catch (error) {
      // Error is handled by toast notification
      toast.error(t('admin.settings.messages.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      await api.put('/admin/settings', settings);
      toast.success(t('admin.settings.messages.saveSuccess'));
    } catch (error) {
      // Error is handled by toast notification
      toast.error(t('admin.settings.messages.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleSendBulkNotification = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/notifications/bulk', bulkNotification);
      toast.success(t('admin.settings.messages.notificationSuccess'));
      setShowBulkNotification(false);
      setBulkNotification({
        title: { uz: '', 'uz-Cyrl': '', ru: '' },
        message: { uz: '', 'uz-Cyrl': '', ru: '' },
        priority: 'medium',
        allUsers: true,
      });
    } catch (error) {
      // Error is handled by toast notification
      toast.error(t('admin.settings.messages.notificationError'));
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!settings) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 dark:text-gray-400">{t('admin.settings.messages.loadError')}</p>
      </div>
    );
  }

  const tabs = [
    { id: 'subscription', name: t('admin.settings.tabs.subscriptionSettings'), icon: FiDollarSign },
    { id: 'exam', name: t('admin.settings.tabs.examSettings'), icon: FiClock },
    { id: 'notification', name: t('admin.settings.tabs.notifications'), icon: FiBell },
    { id: 'contact', name: t('admin.settings.tabs.contactInfo'), icon: FiPhone },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('admin.settings.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t('admin.settings.subtitle')}
          </p>
        </div>
        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className="btn-primary flex items-center mt-4 sm:mt-0"
        >
          {saving ? (
            <LoadingSpinner size="small" />
          ) : (
            <>
              <FiSave className="w-4 h-4 mr-2" />
              {t('common.save')}
            </>
          )}
        </button>
      </div>

      {/* Tabs */}
      <div className="card p-1">
        <div className="flex flex-wrap">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-4 py-2 mr-1 mb-1 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {tab.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <div className="card p-6">
        {activeTab === 'subscription' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('admin.settings.subscriptionPricing')}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="label">{t('admin.settings.15DaysPrice')}</label>
                <div className="relative">
                  <FiDollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="number"
                    value={settings.subscriptionPrices?.['15_days'] || 30000}
                    onChange={(e) => setSettings({
                      ...settings,
                      subscriptionPrices: {
                        ...settings.subscriptionPrices,
                        '15_days': parseInt(e.target.value)
                      }
                    })}
                    className="input pl-10"
                  />
                </div>
              </div>
              
              <div>
                <label className="label">{t('admin.settings.1MonthPrice')}</label>
                <div className="relative">
                  <FiDollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="number"
                    value={settings.subscriptionPrices?.['1_month'] || 50000}
                    onChange={(e) => setSettings({
                      ...settings,
                      subscriptionPrices: {
                        ...settings.subscriptionPrices,
                        '1_month': parseInt(e.target.value)
                      }
                    })}
                    className="input pl-10"
                  />
                </div>
              </div>
              
              <div>
                <label className="label">{t('admin.settings.3MonthsPrice')}</label>
                <div className="relative">
                  <FiDollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="number"
                    value={settings.subscriptionPrices?.['3_months'] || 120000}
                    onChange={(e) => setSettings({
                      ...settings,
                      subscriptionPrices: {
                        ...settings.subscriptionPrices,
                        '3_months': parseInt(e.target.value)
                      }
                    })}
                    className="input pl-10"
                  />
                </div>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                <strong>{t('common.warning')}:</strong> {t('admin.settings.notes.priceNote')}
              </p>
            </div>
          </motion.div>
        )}

        {activeTab === 'exam' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('admin.settings.examConfiguration')}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="label">{t('admin.settings.labels.questionsCount')}</label>
                <input
                  type="number"
                  value={settings.examSettings?.questionsCount || 20}
                  onChange={(e) => setSettings({
                    ...settings,
                    examSettings: {
                      ...settings.examSettings,
                      questionsCount: parseInt(e.target.value)
                    }
                  })}
                  className="input"
                  min="10"
                  max="100"
                />
              </div>
              
              <div>
                <label className="label">{t('admin.settings.labels.timeLimit')}</label>
                <div className="relative">
                  <FiClock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="number"
                    value={settings.examSettings?.timeLimit || 20}
                    onChange={(e) => setSettings({
                      ...settings,
                      examSettings: {
                        ...settings.examSettings,
                        timeLimit: parseInt(e.target.value)
                      }
                    })}
                    className="input pl-10"
                    min="5"
                    max="120"
                  />
                </div>
              </div>
              
              <div>
                <label className="label">{t('admin.settings.passingPercentage')}</label>
                <div className="relative">
                  <FiPercent className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="number"
                    value={settings.examSettings?.passingScore || 90}
                    onChange={(e) => setSettings({
                      ...settings,
                      examSettings: {
                        ...settings.examSettings,
                        passingScore: parseInt(e.target.value)
                      }
                    })}
                    className="input pl-10"
                    min="50"
                    max="100"
                  />
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-300">
                <strong>{t('common.warning')}:</strong> {t('admin.settings.notes.examNote')}
              </p>
            </div>
          </motion.div>
        )}

        {activeTab === 'notification' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('admin.settings.notificationConfiguration')}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="label">{t('admin.settings.labels.subscriptionWarnings')}</label>
                <div className="flex space-x-2">
                  {(settings.systemSettings?.subscriptionWarningDays || [7, 3, 1]).map((day, index) => (
                    <input
                      key={index}
                      type="number"
                      value={day}
                      onChange={(e) => {
                        const newDays = [...(settings.systemSettings?.subscriptionWarningDays || [7, 3, 1])];
                        newDays[index] = parseInt(e.target.value);
                        setSettings({
                          ...settings,
                          systemSettings: {
                            ...settings.systemSettings,
                            subscriptionWarningDays: newDays
                          }
                        });
                      }}
                      className="input w-20"
                      min="1"
                      max="30"
                    />
                  ))}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {t('admin.settings.subscriptionWarningDescription')}
                </p>
              </div>

              <div>
                <label className="label">{t('admin.settings.labels.profileDeletionPeriod')}</label>
                <div className="relative">
                  <FiTrash2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="number"
                    value={settings.systemSettings?.profileDeletionDays || 30}
                    onChange={(e) => setSettings({
                      ...settings,
                      systemSettings: {
                        ...settings.systemSettings,
                        profileDeletionDays: parseInt(e.target.value)
                      }
                    })}
                    className="input pl-10"
                    min="7"
                    max="90"
                  />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {t('admin.settings.profileDeletionDescription')}
                </p>
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowBulkNotification(true)}
                  className="btn-secondary flex items-center"
                >
                  <FiBell className="w-4 h-4 mr-2" />
                  {t('admin.settings.sendBulkNotification')}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'contact' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('admin.settings.contactInformation')}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="label">{t('admin.settings.labels.phoneNumber')}</label>
                <div className="relative">
                  <FiPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={settings.contactInfo?.phone || ''}
                    onChange={(e) => setSettings({
                      ...settings,
                      contactInfo: {
                        ...settings.contactInfo,
                        phone: e.target.value
                      }
                    })}
                    className="input pl-10"
                    placeholder="+998901234567"
                  />
                </div>
              </div>

              <div>
                <label className="label">{t('admin.settings.labels.contactUrl')}</label>
                <div className="relative">
                  <FiLink className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="url"
                    value={settings.contactInfo?.contactUrl || ''}
                    onChange={(e) => setSettings({
                      ...settings,
                      contactInfo: {
                        ...settings.contactInfo,
                        contactUrl: e.target.value
                      }
                    })}
                    className="input pl-10"
                    placeholder="https://t.me/username yoki istalgan manzil"
                  />
                </div>
              </div>

              <div>
                <label className="label">{t('admin.settings.labels.email')}</label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={settings.contactInfo?.email || ''}
                    onChange={(e) => setSettings({
                      ...settings,
                      contactInfo: {
                        ...settings.contactInfo,
                        email: e.target.value
                      }
                    })}
                    className="input pl-10"
                    placeholder="info@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="label">{t('admin.settings.labels.address')}</label>
                
                {/* Uzbek Address */}
                <div className="mb-3">
                  <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">
                    O'zbek tilida
                  </label>
                  <div className="relative">
                    <FiMapPin className="absolute left-3 top-3 text-gray-400" />
                    <textarea
                      value={settings.contactInfo?.address?.uz || ''}
                      onChange={(e) => setSettings({
                        ...settings,
                        contactInfo: {
                          ...settings.contactInfo,
                          address: {
                            ...settings.contactInfo?.address,
                            uz: e.target.value
                          }
                        }
                      })}
                      className="input pl-10"
                      rows="2"
                      placeholder="Manzilni o'zbek tilida yozing"
                    />
                  </div>
                </div>

                {/* Russian Address */}
                <div className="mb-3">
                  <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">
                    Русский язык
                  </label>
                  <div className="relative">
                    <FiMapPin className="absolute left-3 top-3 text-gray-400" />
                    <textarea
                      value={settings.contactInfo?.address?.ru || ''}
                      onChange={(e) => setSettings({
                        ...settings,
                        contactInfo: {
                          ...settings.contactInfo,
                          address: {
                            ...settings.contactInfo?.address,
                            ru: e.target.value
                          }
                        }
                      })}
                      className="input pl-10"
                      rows="2"
                      placeholder="Напишите адрес на русском языке"
                    />
                  </div>
                </div>

                {/* English Address */}
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">
                    English
                  </label>
                  <div className="relative">
                    <FiMapPin className="absolute left-3 top-3 text-gray-400" />
                    <textarea
                      value={settings.contactInfo?.address?.en || ''}
                      onChange={(e) => setSettings({
                        ...settings,
                        contactInfo: {
                          ...settings.contactInfo,
                          address: {
                            ...settings.contactInfo?.address,
                            en: e.target.value
                          }
                        }
                      })}
                      className="input pl-10"
                      rows="2"
                      placeholder="Write address in English"
                    />
                  </div>
                </div>
              </div>

              {/* Social Media Links */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                  {t('admin.settings.socialMediaLinks')}
                </h4>
                
                <div className="space-y-4">
                  <div>
                    <label className="label">WhatsApp</label>
                    <div className="relative">
                      <FiPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={settings.contactInfo?.whatsapp || ''}
                        onChange={(e) => setSettings({
                          ...settings,
                          contactInfo: {
                            ...settings.contactInfo,
                            whatsapp: e.target.value
                          }
                        })}
                        className="input pl-10"
                        placeholder="+998901234567"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="label">Telegram</label>
                    <div className="relative">
                      <FiSend className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={settings.contactInfo?.telegram || ''}
                        onChange={(e) => setSettings({
                          ...settings,
                          contactInfo: {
                            ...settings.contactInfo,
                            telegram: e.target.value
                          }
                        })}
                        className="input pl-10"
                        placeholder="@username yoki https://t.me/username"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="label">Instagram</label>
                    <div className="relative">
                      <FiInstagram className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={settings.contactInfo?.instagram || ''}
                        onChange={(e) => setSettings({
                          ...settings,
                          contactInfo: {
                            ...settings.contactInfo,
                            instagram: e.target.value
                          }
                        })}
                        className="input pl-10"
                        placeholder="@username yoki https://instagram.com/username"
                      />
                    </div>
                  </div>

                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <FiAlertCircle className="inline-block w-4 h-4 mr-1" />
                {t('admin.settings.contactInfoNote')}
              </p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Bulk notification modal */}
      {showBulkNotification && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-dark-card rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('admin.settings.sendBulkNotification')}
            </h3>

            <form onSubmit={handleSendBulkNotification} className="space-y-6">
              {/* Title */}
              <div>
                <label className="label">{t('admin.settings.notificationTitle')}</label>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder={t('common.uz')}
                    value={bulkNotification.title.uz}
                    onChange={(e) => setBulkNotification({
                      ...bulkNotification,
                      title: { ...bulkNotification.title, uz: e.target.value }
                    })}
                    className="input"
                    required
                  />
                  <input
                    type="text"
                    placeholder={t('common.uzCyrl')}
                    value={bulkNotification.title['uz-Cyrl']}
                    onChange={(e) => setBulkNotification({
                      ...bulkNotification,
                      title: { ...bulkNotification.title, 'uz-Cyrl': e.target.value }
                    })}
                    className="input"
                  />
                  <input
                    type="text"
                    placeholder={t('common.ru')}
                    value={bulkNotification.title.ru}
                    onChange={(e) => setBulkNotification({
                      ...bulkNotification,
                      title: { ...bulkNotification.title, ru: e.target.value }
                    })}
                    className="input"
                  />
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="label">{t('admin.settings.notificationMessage')}</label>
                <div className="space-y-2">
                  <textarea
                    placeholder={t('common.uz')}
                    value={bulkNotification.message.uz}
                    onChange={(e) => setBulkNotification({
                      ...bulkNotification,
                      message: { ...bulkNotification.message, uz: e.target.value }
                    })}
                    className="input"
                    rows="3"
                    required
                  />
                  <textarea
                    placeholder={t('common.uzCyrl')}
                    value={bulkNotification.message['uz-Cyrl']}
                    onChange={(e) => setBulkNotification({
                      ...bulkNotification,
                      message: { ...bulkNotification.message, 'uz-Cyrl': e.target.value }
                    })}
                    className="input"
                    rows="3"
                  />
                  <textarea
                    placeholder={t('common.ru')}
                    value={bulkNotification.message.ru}
                    onChange={(e) => setBulkNotification({
                      ...bulkNotification,
                      message: { ...bulkNotification.message, ru: e.target.value }
                    })}
                    className="input"
                    rows="3"
                  />
                </div>
              </div>

              {/* Priority */}
              <div>
                <label className="label">{t('admin.settings.priorityLevel')}</label>
                <select
                  value={bulkNotification.priority}
                  onChange={(e) => setBulkNotification({ ...bulkNotification, priority: e.target.value })}
                  className="input"
                >
                  <option value="low">{t('common.priority.low')}</option>
                  <option value="medium">{t('common.priority.medium')}</option>
                  <option value="high">{t('common.priority.high')}</option>
                </select>
              </div>

              {/* Target users */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="allUsers"
                  checked={bulkNotification.allUsers}
                  onChange={(e) => setBulkNotification({ ...bulkNotification, allUsers: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="allUsers" className="text-sm text-gray-700 dark:text-gray-300">
                  {t('admin.settings.sendToAllActiveUsers')}
                </label>
              </div>

              {/* Form actions */}
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setShowBulkNotification(false)}
                  className="flex-1 btn-secondary"
                >
                  {t('common.cancel')}
                </button>
                <button type="submit" className="flex-1 btn-primary">
                  {t('common.send')}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;