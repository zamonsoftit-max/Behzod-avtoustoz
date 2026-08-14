import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  FiUsers,
  FiDollarSign,
  FiActivity,
  FiBookOpen,
  FiFileText,
  FiClipboard,
  FiUserCheck,
} from 'react-icons/fi';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatCurrency } from '../../utils/formatters';
import toast from 'react-hot-toast';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const DashboardPage = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  
  // Helper function to format currency with translation
  const formatCurrencyWithTranslation = (amount) => {
    const formatted = formatCurrency(amount);
    return formatted.replace(/so'm/g, t('common.currency'));
  };

  // fetchDashboardStats is intentionally kept stable for the polling interval.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchDashboardStats();
    const interval = setInterval(fetchDashboardStats, 30000); // Refresh every 30 seconds
    
    // Listen for theme changes
    const handleStorageChange = () => {
      setTheme(localStorage.getItem('theme') || 'light');
    };
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/dashboard/stats');
      setStats(response.data.data);
    } catch (error) {
      toast.error(
        error.response?.data?.message || t('admin.dashboard.errors.loadError'),
        {
          position: 'top-right',
          autoClose: 5000,
        }
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading && !stats) {
    return <LoadingSpinner fullScreen />;
  }

  if (!stats) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 dark:text-gray-400">{t('admin.dashboard.errors.loadError')}</p>
      </div>
    );
  }

  const statCards = [
    {
      title: t('admin.dashboard.stats.totalUsers'),
      value: stats.users.total,
      change: `+${stats.users.newToday || 0}`,
      changeLabel: t('admin.dashboard.labels.today'),
      icon: <FiUsers className="w-6 h-6" />,
      color: 'bg-blue-500',
    },
    {
      title: t('admin.dashboard.stats.activeSubscriptions'),
      value: stats.users.activeSubscriptions,
      change: stats.users.total > 0 
        ? `${((stats.users.activeSubscriptions / stats.users.total) * 100).toFixed(1)}%`
        : '0%',
      changeLabel: t('admin.dashboard.labels.percent'),
      icon: <FiUserCheck className="w-6 h-6" />,
      color: 'bg-green-500',
    },
    {
      title: t('admin.dashboard.stats.monthlyRevenue'),
      value: formatCurrencyWithTranslation(stats.revenue.totalRevenue || 0),
      change: `${stats.revenue.totalTransactions || 0}`,
      changeLabel: t('admin.dashboard.labels.payments'),
      icon: <FiDollarSign className="w-6 h-6" />,
      color: 'bg-purple-500',
    },
    {
      title: t('admin.dashboard.stats.onlineNow'),
      value: stats.users.onlineNow || 0,
      change: t('admin.dashboard.live'),
      changeLabel: t('admin.dashboard.labels.status'),
      icon: <FiActivity className="w-6 h-6" />,
      color: 'bg-orange-500',
    },
  ];

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: theme === 'dark' ? '#fff' : '#000',
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: document.documentElement.classList.contains('dark') ? '#374151' : '#e5e7eb',
        },
        ticks: {
          color: document.documentElement.classList.contains('dark') ? '#9ca3af' : '#6b7280',
        },
      },
      y: {
        grid: {
          color: document.documentElement.classList.contains('dark') ? '#374151' : '#e5e7eb',
        },
        ticks: {
          color: document.documentElement.classList.contains('dark') ? '#9ca3af' : '#6b7280',
        },
      },
    },
  };

  const revenueChartData = {
    labels: stats.revenue?.dailyRevenue ? stats.revenue.dailyRevenue.map(d => d._id) : [],
    datasets: [
      {
        label: t('admin.dashboard.charts.revenue_trend'),
        data: stats.revenue?.dailyRevenue ? stats.revenue.dailyRevenue.map(d => d.revenue) : [],
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        tension: 0.3,
      },
    ],
  };

  const subscriptionTypeData = {
    labels: stats?.revenue?.byType ? stats.revenue.byType.map(item => {
      const typeNames = {
        '15_days': t('admin.dashboard.subscriptionTypes.15_days'),
        '1_month': t('admin.dashboard.subscriptionTypes.1_month'),
        '3_months': t('admin.dashboard.subscriptionTypes.3_months'),
      };
      return typeNames[item.subscriptionType] || item.subscriptionType;
    }) : [],
    datasets: [
      {
        data: stats?.revenue?.byType ? stats.revenue.byType.map(item => item.revenue) : [],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(139, 92, 246, 0.8)',
        ],
      },
    ],
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('admin.dashboard.title')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {t('admin.dashboard.subtitle')}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="card p-6"
          >
            <div className="flex items-center justify-between">
              <div className={`p-3 rounded-lg ${stat.color} text-white`}>
                {stat.icon}
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 dark:text-gray-400">{stat.changeLabel}</p>
                <p className={`text-sm font-semibold ${
                  stat.change && typeof stat.change === 'string' && stat.change.includes('+') ? 'text-green-600' : 'text-gray-900 dark:text-white'
                }`}>
                  {stat.change}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{stat.title}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('admin.reports.labels.dailyRevenue')}
          </h3>
          <div className="h-64">
            {stats.revenue?.dailyRevenue && stats.revenue.dailyRevenue.length > 0 ? (
              <Line data={revenueChartData} options={chartOptions} />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                {t('admin.dashboard.noDataAvailable')}
              </div>
            )}
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('admin.reports.labels.bySubscriptionType')}
          </h3>
          <div className="h-64">
            {stats.revenue.byType && stats.revenue.byType.length > 0 ? (
              <Doughnut data={subscriptionTypeData} options={chartOptions} />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                {t('admin.dashboard.noDataAvailable')}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <FiBookOpen className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.content.questions}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('admin.dashboard.labels.questions')}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {t('admin.dashboard.topicsByCount', { count: stats.content.topics })}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <FiFileText className="w-8 h-8 text-green-600 dark:text-green-400" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.content.tickets}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('admin.dashboard.labels.tickets')}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {t('admin.dashboard.readyTestTickets')}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <FiClipboard className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.tests.total}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('admin.dashboard.labels.tests')}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {t('admin.dashboard.todayCount', { count: stats.tests.today })}
          </p>
        </motion.div>
      </div>


      {/* Recent activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('admin.reports.stats.newUsers')}
          </h3>
          <div className="space-y-3">
            {stats.recent.users.slice(0, 5).map((user) => (
              <div key={user._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{user.fullName}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{user.phoneNumber}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {new Date(user.createdAt).toLocaleDateString('uz-UZ')}
                  </p>
                  <p className="text-xs font-medium text-primary-600 dark:text-primary-400">
                    {user.subscription?.isActive ? t('admin.dashboard.status.active') : t('admin.dashboard.status.inactive')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('admin.dashboard.recentPayments')}
          </h3>
          <div className="space-y-3">
            {stats.recent.payments.slice(0, 5).map((payment) => (
              <div key={payment._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {payment.user?.fullName || t('admin.dashboard.labels.unknown')}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {payment.paymentMethod}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-600 dark:text-green-400">
                    {formatCurrencyWithTranslation(payment.amount)}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {new Date(payment.paidAt).toLocaleDateString('uz-UZ')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
