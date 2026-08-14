import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  FiUser,
  FiPhone,
  FiCalendar,
  FiCheckCircle,
  FiXCircle,
  FiEdit,
  FiArrowLeft,
} from 'react-icons/fi';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatDate, formatCurrency } from '../../utils/formatters';
import toast from 'react-hot-toast';

const UserDetailsPage = () => {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [testHistory, setTestHistory] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    subscriptionType: '',
    subscriptionDays: '',
  });

  useEffect(() => {
    fetchUserDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/users/${id}`);
      
      if (response.data.success && response.data.data) {
        const data = response.data.data;
        setUser(data.user);
        setTestHistory(data.testResults || []);
        setPaymentHistory(data.payments || []);
      }
    } catch (error) {
      toast.error(t('admin.users.messages.loadError'));
      navigate('/admin/users');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSubscription = async () => {
    try {
      // Calculate end date based on subscription days
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + parseInt(editForm.subscriptionDays));
      
      await api.put(`/admin/users/${id}`, {
        subscription: {
          type: editForm.subscriptionType,
          endDate: endDate,
          isActive: true
        }
      });
      toast.success(t('admin.users.messages.subscriptionUpdated'));
      setShowEditModal(false);
      fetchUserDetails();
    } catch (error) {
      // Error is handled by toast notification
      toast.error(t('admin.users.messages.subscriptionUpdateError'));
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 dark:text-gray-400">{t('admin.users.messages.userNotFound')}</p>
      </div>
    );
  }

  const getProgressColor = (percentage) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/admin/users')}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
          >
            <FiArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {user.fullName}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">{t('admin.users.details.title')}</p>
          </div>
        </div>
        <button
          onClick={() => setShowEditModal(true)}
          className="btn-primary flex items-center"
        >
          <FiEdit className="w-4 h-4 mr-2" />
          {t('admin.users.actions.updateSubscription')}
        </button>
      </div>

      {/* User info cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main info */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('admin.users.details.basicInfo')}
          </h3>
          <div className="space-y-4">
            <div className="flex items-center">
              <FiUser className="w-5 h-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('admin.users.fields.fullName')}</p>
                <p className="font-medium text-gray-900 dark:text-white">{user.fullName}</p>
              </div>
            </div>
            <div className="flex items-center">
              <FiPhone className="w-5 h-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('admin.users.fields.phoneNumber')}</p>
                <p className="font-medium text-gray-900 dark:text-white">{user.phoneNumber}</p>
              </div>
            </div>
            <div className="flex items-center">
              <FiCalendar className="w-5 h-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('admin.users.fields.registeredAt')}</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {formatDate(user.createdAt, 'full', i18n.language)}
                </p>
              </div>
            </div>
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{t('admin.users.fields.status')}</p>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  user.isActive
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                }`}
              >
                {user.isActive ? t('admin.users.status.active') : t('admin.users.status.blocked')}
              </span>
            </div>
          </div>
        </div>

        {/* Subscription info */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('admin.users.details.subscriptionInfo')}
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('admin.users.fields.subscriptionType')}</p>
              <p className="font-medium text-gray-900 dark:text-white capitalize">
                {user.subscription.type ? t(`subscription.types.${user.subscription.type}`) : t('common.notAvailable')}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('admin.users.fields.subscriptionStatus')}</p>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  user.subscription?.isActive
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                }`}
              >
                {user.subscription?.isActive ? t('admin.users.subscription.active') : t('admin.users.subscription.inactive')}
              </span>
            </div>
            {user.subscription?.isActive && (
              <>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('admin.users.fields.startDate')}</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formatDate(user.subscription.startDate, 'full', i18n.language)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('admin.users.fields.endDate')}</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formatDate(user.subscription.endDate, 'full', i18n.language)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('admin.users.fields.daysLeft')}</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {Math.max(
                      0,
                      Math.ceil(
                        (new Date(user.subscription.endDate) - new Date()) / (1000 * 60 * 60 * 24)
                      )
                    )}{' '}
                    {t('common.days')}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Statistics */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('admin.users.details.statistics')}
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('admin.users.stats.totalTests')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {user.statistics?.totalTests || 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('admin.users.stats.passedTests')}</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {user.statistics?.passedTests || 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('admin.users.stats.averageScore')}</p>
              <p className={`text-2xl font-bold ${getProgressColor(user.statistics?.averageScore || 0)}`}>
                {(user.statistics?.averageScore || 0).toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('admin.users.stats.examAttempts')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {user.statistics?.examAttempts || 0}
              </p>
            </div>
          </div>
        </div>
      </div>


      {/* Test history */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t('admin.users.details.testHistory')}
        </h3>
        {testHistory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left">{t('admin.users.table.date')}</th>
                  <th className="px-4 py-3 text-left">{t('admin.users.table.testType')}</th>
                  <th className="px-4 py-3 text-left">{t('admin.users.table.topicTicket')}</th>
                  <th className="px-4 py-3 text-center">{t('admin.users.table.result')}</th>
                  <th className="px-4 py-3 text-center">{t('admin.users.table.score')}</th>
                  <th className="px-4 py-3 text-center">{t('admin.users.table.time')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {testHistory.map((test) => (
                  <tr key={test._id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-300">
                      {formatDate(test.createdAt, 'short', i18n.language)}
                    </td>
                    <td className="px-4 py-3 text-sm capitalize text-gray-900 dark:text-gray-300">{t(`test.types.${test.testType}`)}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-300">
                      {test.topic
                        ? test.topic.name[i18n.language] || test.topic.name.uz
                        : test.ticket
                        ? `${t('common.ticket')} №${test.ticket.number}`
                        : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {test.isPassed ? (
                        <FiCheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                      ) : (
                        <FiXCircle className="w-5 h-5 text-red-600 mx-auto" />
                      )}
                    </td>
                    <td className="px-4 py-3 text-center font-medium">
                      <span className={getProgressColor(test.percentage)}>
                        {test.percentage.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-900 dark:text-gray-300">
                      {Math.floor(test.timeTaken / 60)}:{(test.timeTaken % 60)
                        .toString()
                        .padStart(2, '0')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-600 dark:text-gray-400">{t('admin.users.messages.noTestHistory')}</p>
        )}
      </div>

      {/* Payment history */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t('admin.users.details.paymentHistory')}
        </h3>
        {paymentHistory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left">{t('admin.users.table.date')}</th>
                  <th className="px-4 py-3 text-left">{t('admin.users.table.subscriptionType')}</th>
                  <th className="px-4 py-3 text-left">{t('admin.users.table.paymentMethod')}</th>
                  <th className="px-4 py-3 text-center">{t('admin.users.table.amount')}</th>
                  <th className="px-4 py-3 text-center">{t('admin.users.table.status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {paymentHistory.map((payment) => (
                  <tr key={payment._id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-300">
                      {formatDate(payment.createdAt, 'short', i18n.language)}
                    </td>
                    <td className="px-4 py-3 text-sm capitalize text-gray-900 dark:text-gray-300">{t(`subscription.types.${payment.subscriptionType}`)}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-300">{t(`payment.methods.${payment.paymentMethod}`)}</td>
                    <td className="px-4 py-3 text-center font-medium text-gray-900 dark:text-gray-300">
                      {formatCurrency(payment.amount, i18n.language)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          payment.status === 'completed'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                            : payment.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                        }`}
                      >
                        {payment.status === 'completed'
                          ? t('payment.status.completed')
                          : payment.status === 'pending'
                          ? t('payment.status.pending')
                          : t('payment.status.cancelled')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-600 dark:text-gray-400">{t('admin.users.messages.noPaymentHistory')}</p>
        )}
      </div>

      {/* Edit subscription modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-dark-card rounded-lg p-6 max-w-md w-full"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('admin.users.actions.updateSubscription')}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="label">{t('admin.users.fields.subscriptionType')}</label>
                <select
                  value={editForm.subscriptionType}
                  onChange={(e) => setEditForm({ ...editForm, subscriptionType: e.target.value })}
                  className="input"
                >
                  <option value="">{t('common.select')}</option>
                  <option value="15_days">{t('subscription.types.15_days')}</option>
                  <option value="1_month">{t('subscription.types.1_month')}</option>
                  <option value="3_months">{t('subscription.types.3_months')}</option>
                </select>
              </div>
              <div>
                <label className="label">{t('admin.users.fields.daysCount')}</label>
                <input
                  type="number"
                  value={editForm.subscriptionDays}
                  onChange={(e) => setEditForm({ ...editForm, subscriptionDays: e.target.value })}
                  className="input"
                  placeholder={t('admin.users.placeholders.daysExample')}
                />
              </div>
            </div>
            <div className="flex space-x-4 mt-6">
              <button onClick={() => setShowEditModal(false)} className="flex-1 btn-secondary">
                {t('common.cancel')}
              </button>
              <button
                onClick={handleUpdateSubscription}
                disabled={!editForm.subscriptionType || !editForm.subscriptionDays}
                className="flex-1 btn-primary"
              >
                {t('common.update')}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default UserDetailsPage;
