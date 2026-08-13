import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiPercent,
  FiTrendingUp,
  FiAlertCircle,
  FiBookOpen,
  FiAward,
  FiZap,
  FiShuffle,
  FiFileText,
  FiActivity,
  FiTarget,
} from 'react-icons/fi';
import { format, differenceInDays, isValid } from 'date-fns';
import { uz, ru } from 'date-fns/locale';
import { uzCyrl } from '../../utils/dateLocale';
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
import { fetchDashboardStats } from '../../store/slices/userThunks';
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

const StudentDashboard = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { dashboardStats, dashboardLoading } = useSelector((state) => state.user);

  useEffect(() => {
    dispatch(fetchDashboardStats())
      .unwrap()
      .catch((error) => {
        const errorMessage = typeof error === 'string' 
          ? error 
          : error?.message || t('student.dashboard.errors.fetchStats');
        // Dashboard stats error
        toast.error(errorMessage);
      });
  }, [dispatch, t]);

  const stats = dashboardStats?.statistics || {};
  const subscription = dashboardStats?.subscription || user?.subscription || {};
  const isSubscriptionActive = subscription?.isActive;
  const daysUntilExpiry = (() => {
    if (!subscription?.endDate) return 0;
    try {
      const endDate = new Date(subscription.endDate);
      if (!isValid(endDate)) return 0;
      return Math.max(0, differenceInDays(endDate, new Date()));
    } catch {
      return 0;
    }
  })();

  // Prepare chart data
  const weekDays = i18n.language === 'uz-Cyrl' 
    ? ['Душ', 'Сеш', 'Чор', 'Пай', 'Жум', 'Шан', 'Як']
    : i18n.language === 'ru'
    ? ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
    : ['Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan', 'Yak'];
  const weeklyProgressData = (() => {
    const data = dashboardStats?.weeklyProgress;
    if (!Array.isArray(data)) return [0, 0, 0, 0, 0, 0, 0];
    return Array(7).fill(0).map((_, index) => {
      const value = data[index];
      return typeof value === 'number' && !isNaN(value) && value >= 0 ? value : 0;
    });
  })();

  const lineChartData = {
    labels: weekDays,
    datasets: [
      {
        label: t('student.dashboard.hoursLabel'),
        data: weeklyProgressData,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        borderWidth: 2,
      },
    ],
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(156, 163, 175, 0.1)',
        },
        ticks: {
          color: 'rgb(107, 114, 128)',
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: 'rgb(107, 114, 128)',
        },
      },
    },
  };

  // Doughnut chart for test results
  const doughnutData = {
    labels: i18n.language === 'uz-Cyrl' 
      ? ['Тўғри', 'Хато']
      : i18n.language === 'ru'
      ? ['Правильно', 'Неправильно']
      : ['To\'g\'ri', 'Xato'],
    datasets: [
      {
        data: [dashboardStats?.statistics?.correctAnswers || 0, dashboardStats?.statistics?.wrongAnswers || 0],
        backgroundColor: ['rgb(34, 197, 94)', 'rgb(239, 68, 68)'],
        borderWidth: 0,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          color: 'rgb(107, 114, 128)',
        },
      },
    },
  };

  const testButtons = [
    {
      title: t('student.dashboard.testTypes.topicTraining'),
      icon: FiBookOpen,
      route: '/student/test/topic-training',
      color: 'from-primary-500 to-primary-600',
    },
    {
      title: t('student.dashboard.testTypes.topicExam'),
      icon: FiAward,
      route: '/student/test/topic-exam',
      color: 'from-primary-500 to-primary-600',
    },
    {
      title: t('student.dashboard.testTypes.intermediate'),
      icon: FiTarget,
      route: '/student/test/intermediate',
      color: 'from-primary-500 to-primary-600',
    },
    {
      title: t('student.dashboard.testTypes.ticketTraining'),
      icon: FiFileText,
      route: '/student/test/ticket-training',
      color: 'from-primary-500 to-primary-600',
    },
    {
      title: t('student.dashboard.testTypes.wrongAnswers'),
      icon: FiXCircle,
      route: '/student/test/wrong-answers',
      color: 'from-primary-500 to-primary-600',
    },
    {
      title: t('student.dashboard.testTypes.myWrongAnswers'),
      icon: FiAlertCircle,
      route: '/student/test/my-wrong-answers',
      color: 'from-primary-500 to-primary-600',
    },
    {
      title: t('student.dashboard.testTypes.randomTest'),
      icon: FiShuffle,
      route: '/student/test/random',
      color: 'from-primary-500 to-primary-600',
    },
    {
      title: t('student.dashboard.testTypes.exam'),
      icon: FiZap,
      route: '/student/test/exam',
      color: 'from-primary-500 to-primary-600',
    },
  ];

  if (dashboardLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('student.dashboard.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t('student.dashboard.welcome', { name: user?.fullName })}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {format(new Date(), 'dd MMMM, yyyy', { 
              locale: i18n.language === 'ru' ? ru : i18n.language === 'uz-Cyrl' ? uzCyrl : uz 
            })}
          </p>
        </div>
      </div>

      {/* Subscription Alert */}
      {(!isSubscriptionActive || daysUntilExpiry <= 7) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-lg p-4 ${
            !isSubscriptionActive
              ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
              : 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FiAlertCircle className={`w-5 h-5 ${
                !isSubscriptionActive ? 'text-red-600' : 'text-yellow-600'
              }`} />
              <div>
                <p className={`font-medium ${
                  !isSubscriptionActive ? 'text-red-900 dark:text-red-300' : 'text-yellow-900 dark:text-yellow-300'
                }`}>
                  {!isSubscriptionActive
                    ? t('student.dashboard.subscriptionExpired')
                    : t('student.dashboard.subscriptionDaysLeft', { days: daysUntilExpiry })}
                </p>
                <p className={`text-sm mt-1 ${
                  !isSubscriptionActive ? 'text-red-700 dark:text-red-400' : 'text-yellow-700 dark:text-yellow-400'
                }`}>
                  {!isSubscriptionActive
                    ? t('student.dashboard.subscriptionExpiredMessage')
                    : t('student.dashboard.subscriptionExpiringMessage')}
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/student/payments')}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {t('student.dashboard.subscription.renew')}
            </button>
          </div>
        </motion.div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-white to-blue-50 dark:from-dark-card dark:to-blue-900/10 rounded-xl shadow-lg p-6 border border-blue-100 dark:border-blue-800/30 hover:shadow-xl transition-all duration-300 hover:scale-105"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('student.dashboard.stats.dailyActivity')}
              </p>
              <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-400 dark:to-blue-500 bg-clip-text text-transparent">
                {(() => {
                  const totalSeconds = dashboardStats?.statistics?.todayActivity || 0;
                  const hours = Math.floor(totalSeconds / 3600);
                  const minutes = Math.floor((totalSeconds % 3600) / 60);
                  const seconds = totalSeconds % 60;
                  
                  if (hours > 0) {
                    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
                  } else if (minutes > 0) {
                    return `${minutes}:${String(seconds).padStart(2, '0')}`;
                  } else {
                    return `${seconds} ${i18n.language === 'uz-Cyrl' ? 'сония' : i18n.language === 'ru' ? 'сек' : 'soniya'}`;
                  }
                })()}
              </p>
            </div>
            <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl shadow-inner">
              <FiClock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-white to-green-50 dark:from-dark-card dark:to-green-900/10 rounded-xl shadow-lg p-6 border border-green-100 dark:border-green-800/30 hover:shadow-xl transition-all duration-300 hover:scale-105"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('student.dashboard.stats.preparationLevel')}
              </p>
              <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-700 dark:from-green-400 dark:to-green-500 bg-clip-text text-transparent">
                {dashboardStats?.preparationLevel || 0}%
              </p>
            </div>
            <div className="p-3 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30 rounded-xl shadow-inner">
              <FiTrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-white to-purple-50 dark:from-dark-card dark:to-purple-900/10 rounded-xl shadow-lg p-6 border border-purple-100 dark:border-purple-800/30 hover:shadow-xl transition-all duration-300 hover:scale-105"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('student.dashboard.stats.totalTests')}
              </p>
              <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 dark:from-purple-400 dark:to-purple-500 bg-clip-text text-transparent">
                {dashboardStats?.statistics?.totalTests || 0}
              </p>
            </div>
            <div className="p-3 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30 rounded-xl shadow-inner">
              <FiCheckCircle className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-white to-orange-50 dark:from-dark-card dark:to-orange-900/10 rounded-xl shadow-lg p-6 border border-orange-100 dark:border-orange-800/30 hover:shadow-xl transition-all duration-300 hover:scale-105"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('student.dashboard.averageScore')}
              </p>
              <p className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 dark:from-orange-400 dark:to-orange-500 bg-clip-text text-transparent">
                {Math.round(dashboardStats?.statistics?.averageScore || 0)}%
              </p>
            </div>
            <div className="p-3 bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/30 dark:to-orange-800/30 rounded-xl shadow-inner">
              <FiPercent className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Progress Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-2 bg-white dark:bg-dark-card rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('student.dashboard.weeklyActivity')}
            </h3>
            <FiActivity className="w-5 h-5 text-gray-400" />
          </div>
          <div className="h-64">
            <Line data={lineChartData} options={lineChartOptions} />
          </div>
        </motion.div>

        {/* Test Results Doughnut */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white dark:bg-dark-card rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('student.dashboard.testResults')}
            </h3>
            <FiTarget className="w-5 h-5 text-gray-400" />
          </div>
          <div className="h-48">
            <Doughnut data={doughnutData} options={doughnutOptions} />
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">{t('student.dashboard.totalQuestions')}:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {(dashboardStats?.statistics?.correctAnswers || 0) + (dashboardStats?.statistics?.wrongAnswers || 0)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">{t('student.dashboard.correctAnswers')}:</span>
              <span className="font-medium text-green-600 dark:text-green-400">
                {dashboardStats?.statistics?.correctAnswers || 0}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">{t('student.dashboard.wrongAnswers')}:</span>
              <span className="font-medium text-red-600 dark:text-red-400">
                {dashboardStats?.statistics?.wrongAnswers || 0}
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Test Types Grid */}
      <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          {t('student.dashboard.testTypes.title')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {testButtons.map((test, index) => {
            const Icon = test.icon;
            return (
              <motion.button
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => {
                  console.log('Test button clicked:', test.title, test.route);
                  console.log('Subscription active:', isSubscriptionActive);
                  if (isSubscriptionActive) {
                    navigate(test.route);
                  } else {
                    toast.error(t('errors.subscriptionRequired'));
                  }
                }}
                disabled={!isSubscriptionActive}
                className={`relative overflow-hidden bg-primary-600 hover:bg-primary-700 dark:bg-primary-600 dark:hover:bg-primary-700 text-white p-6 rounded-lg transition-all duration-300 transform hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <div className="flex flex-col items-center space-y-3 relative z-10">
                  <Icon className="w-8 h-8" />
                  <span className="text-sm font-medium text-center leading-tight">
                    {test.title}
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;