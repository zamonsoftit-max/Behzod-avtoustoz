import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiSearch,
  FiEdit,
  FiTrash2,
  FiEye,
  FiUserCheck,
  FiUserX,
  FiCalendar,
  FiPhone,
} from 'react-icons/fi';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Pagination from '../../components/common/Pagination';
import ConfirmModal from '../../components/common/ConfirmModal';
import toast from 'react-hot-toast';
import { formatDate } from '../../utils/formatters';

const UsersPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [subscriptionFilter, setSubscriptionFilter] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });
  
  // Add abort controller to cancel pending requests
  const abortControllerRef = React.useRef(null);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchUsers();
    }, searchTerm ? 500 : 0); // Add 500ms delay for search

    return () => {
      clearTimeout(delayDebounceFn);
      // Cancel any pending requests on unmount
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, searchTerm, statusFilter, subscriptionFilter]);

  const fetchUsers = async () => {
    try {
      // Cancel previous request if exists
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // Create new abort controller
      abortControllerRef.current = new AbortController();
      
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
      });

      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);
      if (subscriptionFilter) params.append('subscriptionStatus', subscriptionFilter);

      const response = await api.get(`/admin/users?${params}`, {
        signal: abortControllerRef.current.signal
      });
      setUsers(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      // Don't show error if request was cancelled
      if (error.name !== 'CanceledError' && error.code !== 'ERR_CANCELED') {
        toast.error(t('admin.users.messages.loadError'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = async (userId, currentStatus) => {
    try {
      await api.put(`/admin/users/${userId}/status`, {
        isActive: !currentStatus,
      });
      toast.success(t('admin.users.messages.statusChanged', { status: t(`admin.users.messages.${!currentStatus ? 'activated' : 'blocked'}`) }));
      fetchUsers();
    } catch (error) {
      // Error is handled by toast notification
      toast.error(t('admin.users.messages.statusError'));
    }
  };

  const handleDeleteUser = async (userId) => {
    setConfirmModal({
      isOpen: true,
      title: t('admin.users.messages.deleteTitle'),
      message: t('admin.users.messages.deleteConfirm'),
      type: 'danger',
      onConfirm: async () => {
        try {
          await api.delete(`/admin/users/${userId}`);
          toast.success(t('admin.users.messages.deleteSuccess'));
          fetchUsers();
        } catch (error) {
          // Error is handled by toast notification
          toast.error(t('admin.users.messages.deleteError'));
        }
      },
    });
  };

  const getSubscriptionBadge = (subscription) => {
    if (!subscription?.isActive) {
      return <span className="badge badge-gray">{t('admin.users.status.inactive')}</span>;
    }

    const daysLeft = Math.ceil(
      (new Date(subscription.endDate) - new Date()) / (1000 * 60 * 60 * 24)
    );

    if (daysLeft <= 3) {
      return <span className="badge badge-red">{t('admin.users.subscription.expiringDays', { days: daysLeft })}</span>;
    } else if (daysLeft <= 7) {
      return <span className="badge badge-yellow">{t('admin.users.subscription.expiringDays', { days: daysLeft })}</span>;
    } else {
      return <span className="badge badge-green">{t('admin.users.subscription.activeDays', { days: daysLeft })}</span>;
    }
  };

  if (loading && users.length === 0) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('admin.users.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t('admin.users.messages.totalUsers', { total: pagination.total })}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={t('admin.users.search_placeholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input"
          >
            <option value="">{t('admin.users.filters.all')}</option>
            <option value="active">{t('admin.users.status.active')}</option>
            <option value="blocked">{t('admin.users.status.blocked')}</option>
          </select>

          <select
            value={subscriptionFilter}
            onChange={(e) => setSubscriptionFilter(e.target.value)}
            className="input"
          >
            <option value="">{t('admin.users.subscription.all')}</option>
            <option value="active">{t('admin.users.subscription.active')}</option>
            <option value="expired">{t('admin.users.subscription.expired')}</option>
            <option value="expiring">{t('admin.users.subscription.expiring')}</option>
          </select>

          <button
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('');
              setSubscriptionFilter('');
            }}
            className="btn-secondary"
          >
            {t('common.clear')}
          </button>
        </div>
      </div>

      {/* Users table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('admin.users.table.name')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('admin.users.table.phone')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('admin.users.table.status')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('admin.users.table.subscription')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('admin.users.table.joined')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('admin.users.table.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-dark-card divide-y divide-gray-200 dark:divide-gray-700">
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <LoadingSpinner />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <p className="text-gray-500 dark:text-gray-400">
                      {searchTerm || statusFilter || subscriptionFilter
                        ? t('admin.users.messages.noResults')
                        : t('admin.users.messages.noUsers')}
                    </p>
                  </td>
                </tr>
              ) : (
                users.map((user, index) => (
                <motion.tr
                  key={user._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {user.fullName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        ID: {user._id.slice(-8)}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900 dark:text-white">
                      <FiPhone className="w-4 h-4 mr-2 text-gray-400" />
                      {user.phoneNumber}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleStatusToggle(user._id, user.isActive)}
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        user.isActive
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                      }`}
                    >
                      {user.isActive ? (
                        <>
                          <FiUserCheck className="w-3 h-3 mr-1" />
                          {t('admin.users.status.active')}
                        </>
                      ) : (
                        <>
                          <FiUserX className="w-3 h-3 mr-1" />
                          {t('admin.users.status.blocked')}
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getSubscriptionBadge(user.subscription)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <FiCalendar className="w-4 h-4 mr-2" />
                      {formatDate(user.createdAt, 'full', i18n.language)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => navigate(`/admin/users/${user._id}`)}
                        className="p-1.5 rounded-lg text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                        title={t('admin.users.actions.view') || "Ko'rish"}
                      >
                        <FiEye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => navigate(`/admin/users/${user._id}/edit`)}
                        className="p-1.5 rounded-lg text-amber-600 hover:text-amber-800 hover:bg-amber-50 dark:hover:bg-amber-900/30 dark:text-amber-400 dark:hover:text-amber-300 transition-colors"
                        title={t('admin.users.actions.edit') || "Tahrirlash"}
                      >
                        <FiEdit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user._id)}
                        className="p-1.5 rounded-lg text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-900/30 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                        title={t('admin.users.actions.delete') || "O'chirish"}
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {t('common.showing')} {(pagination.page - 1) * pagination.limit + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} {t('common.of')} {pagination.total} {t('common.items')}
            </div>
            {(pagination.pages || pagination.totalPages) > 1 && (
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.pages}
                onPageChange={(page) => {
                  setPagination({ ...pagination, page });
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
      />
    </div>
  );
};

export default UsersPage;
