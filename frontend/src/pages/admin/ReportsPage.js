import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  FiDownload,
  FiCalendar,
  FiUsers,
  FiDollarSign,
  FiFileText,
  FiTrendingUp,
  FiBarChart,
  FiPieChart,
  FiActivity,
} from 'react-icons/fi';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatCurrency, formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const ReportsPage = () => {
  const { t, i18n } = useTranslation();
  const [reportType, setReportType] = useState('overall');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper function to format currency with translation
  const formatCurrencyWithTranslation = (amount) => {
    const formatted = formatCurrency(amount);
    return formatted.replace(/so'm/g, t('common.currency'));
  };

  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportType, dateRange]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        type: reportType,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });

      const response = await api.get(`/admin/reports?${params}`);
      setReportData(response.data.data);
    } catch (error) {
      // Error is handled by toast notification
      toast.error(t('admin.reports.errors.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (format) => {
    try {
      const response = await api.post('/admin/reports/export', {
        type: reportType,
        format,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        language: i18n.language,
      }, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report-${reportType}-${Date.now()}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success(t('admin.reports.messages.exportSuccess'));
    } catch (error) {
      // Error is handled by toast notification
      toast.error(t('admin.reports.errors.exportError'));
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  const reportTypes = [
    { id: 'overall', name: t('admin.reports.types.overall'), icon: FiBarChart },
    { id: 'users', name: t('admin.reports.types.users'), icon: FiUsers },
    { id: 'revenue', name: t('admin.reports.types.revenue'), icon: FiDollarSign },
    { id: 'tests', name: t('admin.reports.types.tests'), icon: FiFileText },
  ];

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  };

  const renderReportContent = () => {
    if (!reportData) return null;

    switch (reportType) {
      case 'users':
        return (
          <div className="space-y-6">
            {/* User stats cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="card p-6">
                <FiUsers className="w-8 h-8 text-blue-600 dark:text-blue-400 mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {reportData.newUsers}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">{t('admin.reports.stats.newUsers')}</p>
              </div>
              <div className="card p-6">
                <FiActivity className="w-8 h-8 text-green-600 dark:text-green-400 mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {reportData.activeSubscriptions}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">{t('admin.reports.stats.activeSubscriptions')}</p>
              </div>
              <div className="card p-6">
                <FiTrendingUp className="w-8 h-8 text-purple-600 dark:text-purple-400 mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {reportData.newUsers && reportData.newUsers > 0 
                    ? ((reportData.activeSubscriptions / reportData.newUsers) * 100).toFixed(1) 
                    : '0.0'}%
                </h3>
                <p className="text-gray-600 dark:text-gray-400">{t('admin.reports.stats.conversion')}</p>
              </div>
            </div>

            {/* Users list */}
            {reportData.usersList && reportData.usersList.length > 0 && (
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  {t('admin.reports.labels.newRegistrations')}
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-xs text-gray-500 dark:text-gray-400 uppercase">
                        <th className="pb-3">{t('admin.reports.table.name')}</th>
                        <th className="pb-3">{t('admin.reports.table.phone')}</th>
                        <th className="pb-3">{t('admin.reports.table.subscription')}</th>
                        <th className="pb-3">{t('admin.reports.table.date')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {reportData.usersList.slice(0, 10).map((user) => (
                        <tr key={user._id}>
                          <td className="py-3 text-sm text-gray-900 dark:text-white">{user.fullName}</td>
                          <td className="py-3 text-sm text-gray-900 dark:text-white">{user.phoneNumber}</td>
                          <td className="py-3 text-sm">
                            <span className={`badge ${user.subscription?.isActive ? 'badge-green' : 'badge-gray'}`}>
                              {user.subscription?.isActive ? t('admin.reports.status.active') : t('admin.reports.status.inactive')}
                            </span>
                          </td>
                          <td className="py-3 text-sm text-gray-900 dark:text-white">{formatDate(user.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        );

      case 'revenue':
        return (
          <div className="space-y-6">
            {/* Revenue stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="card p-6">
                <FiDollarSign className="w-8 h-8 text-green-600 dark:text-green-400 mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrencyWithTranslation(reportData.totalRevenue)}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">{t('admin.reports.stats.totalRevenue')}</p>
              </div>
              <div className="card p-6">
                <FiFileText className="w-8 h-8 text-blue-600 dark:text-blue-400 mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {reportData.paymentsCount}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">{t('admin.reports.stats.paymentCount')}</p>
              </div>
              <div className="card p-6">
                <FiTrendingUp className="w-8 h-8 text-purple-600 dark:text-purple-400 mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrencyWithTranslation(reportData.averagePayment)}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">{t('admin.reports.stats.averagePayment')}</p>
              </div>
              <div className="card p-6">
                <FiPieChart className="w-8 h-8 text-orange-600 dark:text-orange-400 mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrencyWithTranslation(reportData.totalRevenue / 30)}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">{t('admin.reports.stats.dailyAverage')}</p>
              </div>
            </div>

            {/* Revenue by type chart */}
            {reportData.paymentsList && (
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  {t('admin.reports.labels.bySubscriptionType')}
                </h3>
                <div className="h-80">
                  <Doughnut
                    data={{
                      labels: [t('admin.reports.subscriptionTypes.15days'), t('admin.reports.subscriptionTypes.1month'), t('admin.reports.subscriptionTypes.3months')],
                      datasets: [{
                        data: [
                          reportData.paymentsList.filter(p => p.subscriptionType === '15_days').reduce((sum, p) => sum + p.amount, 0),
                          reportData.paymentsList.filter(p => p.subscriptionType === '1_month').reduce((sum, p) => sum + p.amount, 0),
                          reportData.paymentsList.filter(p => p.subscriptionType === '3_months').reduce((sum, p) => sum + p.amount, 0),
                        ],
                        backgroundColor: [
                          'rgba(59, 130, 246, 0.8)',
                          'rgba(16, 185, 129, 0.8)',
                          'rgba(139, 92, 246, 0.8)',
                        ],
                      }],
                    }}
                    options={chartOptions}
                  />
                </div>
              </div>
            )}
          </div>
        );

      case 'tests':
        return (
          <div className="space-y-6">
            {/* Test stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="card p-6">
                <FiFileText className="w-8 h-8 text-blue-600 dark:text-blue-400 mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {reportData.totalTests}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">{t('admin.reports.stats.totalTests')}</p>
              </div>
              <div className="card p-6">
                <FiActivity className="w-8 h-8 text-green-600 dark:text-green-400 mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {reportData.passedTests}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">{t('admin.reports.stats.passedTests')}</p>
              </div>
              <div className="card p-6">
                <FiTrendingUp className="w-8 h-8 text-purple-600 dark:text-purple-400 mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {reportData.passRate}%
                </h3>
                <p className="text-gray-600 dark:text-gray-400">{t('admin.reports.stats.passRate')}</p>
              </div>
              <div className="card p-6">
                <FiBarChart className="w-8 h-8 text-orange-600 dark:text-orange-400 mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {reportData.averageScore ? reportData.averageScore.toFixed(1) : '0.0'}%
                </h3>
                <p className="text-gray-600 dark:text-gray-400">{t('admin.reports.stats.averageScore')}</p>
              </div>
            </div>

            {/* Test types distribution */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {t('admin.reports.labels.testTypeDistribution')}
              </h3>
              <div className="h-80">
                <Bar
                  data={{
                    labels: [t('admin.reports.testTypes.byTopic'), t('admin.reports.testTypes.byTicket'), t('admin.reports.testTypes.random'), t('admin.reports.testTypes.exam'), t('admin.reports.testTypes.errorQuestions')],
                    datasets: [{
                      label: t('admin.reports.charts.tests'),
                      data: [120, 85, 95, 150, 65],
                      backgroundColor: 'rgba(99, 102, 241, 0.8)',
                    }],
                  }}
                  options={chartOptions}
                />
              </div>
            </div>
          </div>
        );

      default: // overall
        return (
          <div className="space-y-6">
            {/* Overall stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card p-6"
              >
                <FiUsers className="w-8 h-8 text-blue-600 dark:text-blue-400 mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {reportData.users?.newUsers || 0}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">{t('admin.reports.stats.newUsers')}</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="card p-6"
              >
                <FiDollarSign className="w-8 h-8 text-green-600 dark:text-green-400 mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrencyWithTranslation(reportData.revenue?.totalRevenue || 0)}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">{t('admin.reports.stats.totalRevenue')}</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="card p-6"
              >
                <FiFileText className="w-8 h-8 text-purple-600 dark:text-purple-400 mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {reportData.tests?.totalTests || 0}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">{t('admin.reports.stats.totalTests')}</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="card p-6"
              >
                <FiActivity className="w-8 h-8 text-orange-600 dark:text-orange-400 mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {reportData.users?.activeSubscriptions || 0}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">{t('admin.reports.stats.activeSubscriptions')}</p>
              </motion.div>
            </div>

            {/* Combined chart */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {t('admin.reports.labels.overallTrend')}
              </h3>
              <div className="h-80">
                <Line
                  data={{
                    labels: [
                      t('admin.reports.weekDays.mon'), 
                      t('admin.reports.weekDays.tue'), 
                      t('admin.reports.weekDays.wed'), 
                      t('admin.reports.weekDays.thu'), 
                      t('admin.reports.weekDays.fri'), 
                      t('admin.reports.weekDays.sat'), 
                      t('admin.reports.weekDays.sun')
                    ],
                    datasets: [
                      {
                        label: t('admin.reports.charts.users'),
                        data: [12, 19, 15, 25, 22, 30, 28],
                        borderColor: 'rgb(59, 130, 246)',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      },
                      {
                        label: t('admin.reports.charts.tests'),
                        data: [45, 52, 48, 65, 59, 72, 68],
                        borderColor: 'rgb(139, 92, 246)',
                        backgroundColor: 'rgba(139, 92, 246, 0.1)',
                      },
                    ],
                  }}
                  options={chartOptions}
                />
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('admin.reports.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t('admin.reports.labels.systemActivity')}
          </p>
        </div>
        <div className="flex space-x-3 mt-4 sm:mt-0">
          <button
            onClick={() => exportReport('xlsx')}
            className="btn-secondary flex items-center"
          >
            <FiDownload className="w-4 h-4 mr-2" />
            Excel
          </button>
          <button
            onClick={() => exportReport('pdf')}
            className="btn-secondary flex items-center"
          >
            <FiDownload className="w-4 h-4 mr-2" />
            PDF
          </button>
        </div>
      </div>

      {/* Report type selector */}
      <div className="card p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {reportTypes.map((type) => {
            const Icon = type.icon;
            return (
              <button
                key={type.id}
                onClick={() => setReportType(type.id)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  reportType === type.id
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <Icon className={`w-6 h-6 mx-auto mb-2 ${
                  reportType === type.id ? 'text-primary-600' : 'text-gray-600 dark:text-gray-400'
                }`} />
                <p className={`text-sm font-medium ${
                  reportType === type.id ? 'text-primary-600' : 'text-gray-900 dark:text-white'
                }`}>
                  {type.name}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Date range selector */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex items-center space-x-2">
            <FiCalendar className="w-5 h-5 text-gray-400" />
            <span className="text-sm text-gray-600 dark:text-gray-400">{t('admin.reports.labels.period')}:</span>
          </div>
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
            className="input"
          />
          <span className="text-gray-600 dark:text-gray-400">-</span>
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
            className="input"
          />
          <button
            onClick={fetchReport}
            className="btn-primary"
          >
            {t('admin.reports.labels.refresh')}
          </button>
        </div>
      </div>

      {/* Report content */}
      {renderReportContent()}
    </div>
  );
};

export default ReportsPage;
