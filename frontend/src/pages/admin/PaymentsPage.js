import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  FiDollarSign,
  FiCheck,
  FiX,
  FiClock,
  FiDownload,
  FiRefreshCw,
  FiCreditCard,
  FiUser,
} from 'react-icons/fi';
import { Line } from 'react-chartjs-2';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Pagination from '../../components/common/Pagination';
import { formatCurrency, formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

const PaymentsPage = () => {
  const { t, i18n } = useTranslation();
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Helper function to format currency with translation
  const formatCurrencyWithTranslation = (amount) => {
    const formatted = formatCurrency(amount);
    return formatted.replace(/so'm/g, t('common.currency'));
  };
  const [statusFilter, setStatusFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundData, setRefundData] = useState({
    amount: '',
    reason: '',
  });

  useEffect(() => {
    fetchPayments();
    fetchPaymentStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, statusFilter, methodFilter, dateRange]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
      });

      if (statusFilter) params.append('status', statusFilter);
      if (methodFilter) params.append('paymentMethod', methodFilter);
      if (dateRange.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange.endDate) params.append('endDate', dateRange.endDate);

      const response = await api.get(`/admin/payments?${params}`);
      setPayments(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      // Error is handled by toast notification
      toast.error(t('admin.payments.messages.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentStats = async () => {
    try {
      const params = new URLSearchParams();
      if (dateRange.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange.endDate) params.append('endDate', dateRange.endDate);

      const response = await api.get(`/admin/payments/stats?${params}`);
      setStats(response.data.data);
    } catch (error) {
      // Error is handled by toast notification
    }
  };

  const handleConfirmPayment = async (paymentId) => {
    if (!window.confirm(t('admin.payments.messages.confirmPayment'))) return;

    try {
      await api.put(`/admin/payments/${paymentId}/confirm`);
      toast.success(t('admin.payments.messages.paymentConfirmed'));
      fetchPayments();
      fetchPaymentStats();
    } catch (error) {
      // Error is handled by toast notification
      toast.error(t('admin.payments.messages.confirmError'));
    }
  };

  const handleRefundPayment = async (e) => {
    e.preventDefault();

    // Validation
    const refundAmount = parseFloat(refundData.amount);
    if (isNaN(refundAmount) || refundAmount <= 0) {
      toast.error(t('admin.payments.messages.refundAmountError'));
      return;
    }
    
    if (refundAmount > selectedPayment.amount) {
      toast.error(t('admin.payments.messages.refundAmountExceed'));
      return;
    }
    
    if (!refundData.reason || refundData.reason.trim().length < 10) {
      toast.error(t('admin.payments.messages.refundReasonError'));
      return;
    }

    try {
      console.log('Sending refund request:', {
        paymentId: selectedPayment._id,
        amount: refundAmount,
        reason: refundData.reason.trim()
      });
      
      await api.post(`/admin/payments/${selectedPayment._id}/refund`, {
        amount: refundAmount,
        reason: refundData.reason.trim()
      });
      
      toast.success(t('admin.payments.messages.refundSuccess'));
      setShowRefundModal(false);
      setSelectedPayment(null);
      setRefundData({ amount: '', reason: '' });
      fetchPayments();
      fetchPaymentStats();
    } catch (error) {
      console.error('Refund error:', error);
      console.error('Error response:', error.response?.data);
      
      const errorMessage = error.response?.data?.message || error.response?.data?.errors?.[0]?.msg || t('admin.payments.messages.refundError');
      toast.error(errorMessage);
    }
  };

  const exportPayments = async (format = 'xlsx') => {
    try {
      const params = {
        type: 'revenue',
        format,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        language: i18n.language,
        // Add current filters
        statusFilter,
        methodFilter,
      };

      const response = await api.post('/admin/reports/export', params, {
        responseType: 'blob',
      });

      // Check if response is actually blob
      if (response.data instanceof Blob) {
        // Get filename from headers if available
        const contentDisposition = response.headers['content-disposition'];
        let filename = `payments-${Date.now()}.${format}`;
        
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
          if (filenameMatch && filenameMatch[1]) {
            filename = filenameMatch[1];
          }
        }

        const url = window.URL.createObjectURL(response.data);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        
        // Clean up
        window.URL.revokeObjectURL(url);
        link.remove();
        
        toast.success(t('admin.payments.messages.exportSuccess'));
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      // Check if error response is blob (error message from server)
      if (error.response && error.response.data instanceof Blob) {
        const text = await error.response.data.text();
        try {
          const errorData = JSON.parse(text);
          toast.error(errorData.message || t('admin.payments.messages.exportError'));
        } catch {
          toast.error(t('admin.payments.messages.exportError'));
        }
      } else {
        toast.error(t('admin.payments.messages.exportError'));
      }
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { 
        className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
        icon: FiClock, 
        text: t('admin.payments.filters.pending') 
      },
      completed: { 
        className: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
        icon: FiCheck, 
        text: t('admin.payments.filters.completed') 
      },
      failed: { 
        className: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
        icon: FiX, 
        text: t('admin.payments.filters.failed') 
      },
      refunded: { 
        className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
        icon: FiRefreshCw, 
        text: t('admin.payments.filters.refunded') 
      },
    };

    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;

    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${badge.className}`}
      >
        <Icon className="w-3 h-3 mr-1" />
        {badge.text}
      </span>
    );
  };

  if (loading && !stats) {
    return <LoadingSpinner fullScreen />;
  }

  const chartData = stats && {
    labels: stats?.dailyRevenue?.map(d => d._id) || [],
    datasets: [
      {
        label: t('admin.payments.stats.dailyRevenue'),
        data: stats?.dailyRevenue?.map(d => d.revenue) || [],
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        tension: 0.3,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        ticks: {
          callback: (value) => formatCurrencyWithTranslation(value),
        },
      },
    },
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('admin.payments.title')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {t('admin.payments.labels.paymentsManagement')}
        </p>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <FiDollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-sm text-green-600 dark:text-green-400">
                +{(stats.growthRate || 0).toFixed(1)}%
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrencyWithTranslation(stats.totalRevenue || 0)}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{t('admin.payments.stats.totalRevenue')}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <FiCreditCard className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.totalPayments || 0}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{t('admin.payments.stats.totalPayments')}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                <FiClock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.pendingPayments || 0}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{t('admin.payments.stats.pendingPayments')}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <FiUser className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrencyWithTranslation(stats.averagePayment || 0)}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{t('admin.payments.stats.averagePayment')}</p>
          </motion.div>
        </div>
      )}

      {/* Revenue chart */}
      {stats && stats.dailyRevenue && stats.dailyRevenue.length > 0 && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('admin.payments.labels.dailyRevenueChart')}
          </h3>
          <div className="h-64">
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-5 gap-3 md:gap-4">
          {/* Status Filter */}
          <div className="w-full">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input w-full"
            >
              <option value="">{t('admin.payments.filters.all')}</option>
              <option value="pending">{t('admin.payments.filters.pending')}</option>
              <option value="completed">{t('admin.payments.filters.completed')}</option>
              <option value="failed">{t('admin.payments.filters.failed')}</option>
              <option value="refunded">{t('admin.payments.filters.refunded')}</option>
            </select>
          </div>

          {/* Method Filter */}
          <div className="w-full">
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="input w-full"
            >
              <option value="">{t('admin.payments.method.all')}</option>
              <option value="click">{t('admin.payments.method.click')}</option>
              <option value="payme">{t('admin.payments.method.payme')}</option>
              <option value="cash">{t('admin.payments.method.cash')}</option>
            </select>
          </div>

          {/* Start Date */}
          <div className="w-full">
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="input w-full"
              style={{
                colorScheme: 'auto'
              }}
            />
          </div>

          {/* End Date */}
          <div className="w-full">
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="input w-full"
              style={{
                colorScheme: 'auto'
              }}
            />
          </div>

          {/* Action Buttons */}
          <div className="w-full sm:col-span-2 md:col-span-3 lg:col-span-1 xl:col-span-1">
            <div className="flex flex-col sm:flex-row gap-2 w-full">
              <button
                onClick={() => exportPayments('xlsx')}
                className="btn-secondary flex items-center justify-center px-3 py-2 flex-1 min-w-0"
                title={t('admin.payments.actions.export')}
              >
                <FiDownload className="w-4 h-4 sm:mr-2" />
                <span className="text-sm hidden sm:inline">{t('admin.payments.actions.export')}</span>
              </button>
              <button
                onClick={() => {
                  setStatusFilter('');
                  setMethodFilter('');
                  setDateRange({ startDate: '', endDate: '' });
                }}
                className="btn-secondary flex items-center justify-center px-3 py-2 flex-1 min-w-0"
              >
                <span className="text-sm">{t('admin.payments.actions.clear')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Payments table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('admin.payments.table.user')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('admin.payments.table.type')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('admin.payments.table.amount')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('admin.payments.table.method')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('admin.payments.table.status')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('admin.payments.table.date')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('admin.payments.table.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-dark-card divide-y divide-gray-200 dark:divide-gray-700">
              {payments.map((payment, index) => (
                <motion.tr
                  key={payment._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {payment.user?.fullName || t('common.deleted')}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {payment.user?.phoneNumber}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900 dark:text-white capitalize">
                      {t(`admin.payments.subscriptionTypes.${payment.subscriptionType}`)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatCurrencyWithTranslation(payment.amount)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900 dark:text-white capitalize">
                      {t(`admin.payments.method.${payment.paymentMethod}`)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(payment.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {formatDate(payment.createdAt, 'short')}
                    </div>
                    {payment.paidAt && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {t('admin.payments.labels.paidAt')}: {formatDate(payment.paidAt, 'time')}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    {payment.status === 'pending' && (
                      <button
                        onClick={() => handleConfirmPayment(payment._id)}
                        className="btn-primary text-sm px-3 py-1"
                      >
                        {i18n.language === 'uz-Cyrl' ? 'Тасдиқлаш' : t('admin.payments.actions.confirm')}
                      </button>
                    )}
                    {payment.status === 'completed' && !payment.refundedAt && (
                      <button
                        onClick={() => {
                          setSelectedPayment(payment);
                          setRefundData({ amount: payment.amount, reason: '' });
                          setShowRefundModal(true);
                        }}
                        className="btn-secondary text-sm px-3 py-1"
                      >
                        {i18n.language === 'uz-Cyrl' ? 'Қайтариш' : t('admin.payments.actions.refund')}
                      </button>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.pages}
              onPageChange={(page) => setPagination({ ...pagination, page })}
            />
          </div>
        )}
      </div>

      {/* Refund modal */}
      {showRefundModal && selectedPayment && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-dark-card rounded-lg p-6 max-w-md w-full"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('admin.payments.messages.refundTitle')}
            </h3>

            <form onSubmit={handleRefundPayment} className="space-y-4">
              <div>
                <label className="label">{t('admin.payments.messages.refundAmount')}</label>
                <input
                  type="number"
                  value={refundData.amount}
                  onChange={(e) => setRefundData({ ...refundData, amount: e.target.value })}
                  className="input"
                  max={selectedPayment.amount}
                  min="0.01"
                  step="0.01"
                  required
                />
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {t('admin.payments.labels.maximum')}: {formatCurrencyWithTranslation(selectedPayment.amount)}
                </p>
              </div>

              <div>
                <label className="label">{t('admin.payments.messages.refundReason')}</label>
                <textarea
                  value={refundData.reason}
                  onChange={(e) => setRefundData({ ...refundData, reason: e.target.value })}
                  className="input"
                  rows="3"
                  required
                  minLength="10"
                  placeholder={t('admin.payments.placeholders.refundReason')}
                />
              </div>

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowRefundModal(false);
                    setSelectedPayment(null);
                  }}
                  className="flex-1 btn-secondary"
                >
                  {i18n.language === 'uz-Cyrl' ? 'Бекор қилиш' : t('common.cancel')}
                </button>
                <button type="submit" className="flex-1 btn-primary">
                  {i18n.language === 'uz-Cyrl' ? 'Қайтариш' : t('admin.payments.actions.refund')}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default PaymentsPage;