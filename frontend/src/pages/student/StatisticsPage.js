import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  FiTrendingUp,
  FiPercent,
  FiClock,
  FiCheckCircle,
  FiActivity,
  FiTarget,
  FiBookOpen,
  FiAlertTriangle,
  FiCalendar,
} from 'react-icons/fi';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
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
  Legend,
} from 'chart.js';
import api from '../../services/api';
import { format, isValid } from 'date-fns';
import toast from 'react-hot-toast';

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

const StatisticsPage = () => {
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState(null);
  const [timeRange, setTimeRange] = useState('week');

  const safeFormatDate = (date, formatString, fallback = '-') => {
    try {
      if (!date) return fallback;
      const dateObj = new Date(date);
      if (!isValid(dateObj) || isNaN(dateObj.getTime())) return fallback;
      const formatted = format(dateObj, formatString);
      return formatted || fallback;
    } catch (error) {
      // Date formatting error
      return fallback;
    }
  };

  useEffect(() => {
    let isMounted = true;
    
    const fetchStatistics = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/users/statistics`, {
          params: { range: timeRange }
        });
        
        if (!isMounted) return;
        
        if (!response?.data?.data) {
          throw new Error('Invalid response format');
        }
        
        const data = response.data.data;
        const validatedData = {
          overall: data.overall || {},
          period: data.period || {},
          topicProgress: Array.isArray(data.topicProgress) ? data.topicProgress : [],
          dailyActivity: Array.isArray(data.dailyActivity) ? data.dailyActivity : [],
          recentTests: Array.isArray(data.recentTests) ? data.recentTests : [],
          mostMistakes: Array.isArray(data.mostMistakes) ? data.mostMistakes : []
        };
        
        if (isMounted) {
          setStatistics(validatedData);
        }
      } catch (error) {
        if (!isMounted) return;
        // Error fetching statistics
        toast.error(error.message || 'Statistikani yuklashda xatolik yuz berdi');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    fetchStatistics();
    
    return () => {
      isMounted = false;
    };
  }, [timeRange, t]);

  const formatDuration = (seconds) => {
    const safeSeconds = Math.max(0, parseInt(seconds) || 0);
    const hours = Math.floor(safeSeconds / 3600);
    const minutes = Math.floor((safeSeconds % 3600) / 60);
    return i18n.language === 'ru' ? `${hours} час ${minutes} мин` : i18n.language === 'uz-Cyrl' ? `${hours} соат ${minutes} дақ` : `${hours} soat ${minutes} daq`;
  };

  const calculatePreparationLevel = (periodData) => {
    if (!periodData || periodData.totalTests === 0) return 0;
    const totalAnswers = (periodData.correctAnswers || 0) + (periodData.wrongAnswers || 0);
    if (totalAnswers === 0) return 0;
    const correctRatio = (periodData.correctAnswers || 0) / totalAnswers;
    return Math.round(correctRatio * 100);
  };

  const calculateAverageScore = (periodData) => {
    if (!periodData || periodData.totalTests === 0) return 0;
    const totalAnswers = (periodData.correctAnswers || 0) + (periodData.wrongAnswers || 0);
    if (totalAnswers === 0) return 0;
    return Math.round(((periodData.correctAnswers || 0) / totalAnswers) * 100);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!statistics) {
    return (
      <div className="text-center py-12">
        <FiAlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">
          {t('statistics.noData')}
        </p>
      </div>
    );
  }

  const { 
    overall = {}, 
    period = {},
    topicProgress = [], 
    dailyActivity = [], 
    recentTests = [],
    mostMistakes = [] 
  } = statistics || {};

  // Progress donut chart data
  const chartData = timeRange === 'all' ? overall : period;
  const totalAnswered = (chartData.correctAnswers || 0) + (chartData.wrongAnswers || 0);
  const totalQuestions = chartData.totalQuestions || ((chartData.correctAnswers || 0) + (chartData.wrongAnswers || 0));
  const hasData = totalAnswered > 0;
  
  const progressChartData = hasData ? {
    labels: [i18n.language === 'ru' ? 'Правильные' : i18n.language === 'uz-Cyrl' ? 'Тўғри' : 'To\'g\'ri', i18n.language === 'ru' ? 'Неправильные' : i18n.language === 'uz-Cyrl' ? 'Хато' : 'Xato'],
    datasets: [
      {
        data: [
          chartData.correctAnswers || 0,
          chartData.wrongAnswers || 0
        ],
        backgroundColor: ['rgb(34, 197, 94)', 'rgb(239, 68, 68)'],
        borderWidth: 0,
      },
    ],
  } : null;

  // Daily activity line chart
  const activityChartData = dailyActivity.length > 0 ? {
    labels: dailyActivity.map(d => safeFormatDate(d.date, 'dd.MM', 'N/A')),
    datasets: [
      {
        label: i18n.language === 'ru' ? 'Активность (часы)' : i18n.language === 'uz-Cyrl' ? 'Фаоллик (соат)' : 'Faollik (soat)',
        data: dailyActivity.map(d => {
          const hours = (d.time || 0) / 3600;
          return isNaN(hours) ? 0 : parseFloat(hours.toFixed(1));
        }),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        borderWidth: 2,
      },
    ],
  } : null;

  // Topics progress bar chart
  const topicsChartData = topicProgress.length > 0 ? {
    labels: topicProgress.slice(0, 10).map(topic => 
      topic.topicId?.name?.[i18n.language] || topic.topicId?.name?.uz || topic.topicId?.name || (i18n.language === 'ru' ? 'Неизвестно' : i18n.language === 'uz-Cyrl' ? 'Номаълум' : 'Noma\'lum')
    ),
    datasets: [
      {
        label: i18n.language === 'ru' ? 'Прогресс (%)' : i18n.language === 'uz-Cyrl' ? 'Прогресс (%)' : 'Progress (%)',
        data: topicProgress.slice(0, 10).map(t => t.progress || 0),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 0,
        borderRadius: 4,
      },
    ],
  } : null;

  const chartOptions = {
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

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {i18n.language === 'ru' ? 'Статистика' : i18n.language === 'uz-Cyrl' ? 'Статистика' : 'Statistika'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {i18n.language === 'ru' ? 'Отслеживайте свой прогресс обучения' : i18n.language === 'uz-Cyrl' ? 'Ўрганиш жараёнингизни кузатинг' : 'O\'rganish jarayoningizni kuzating'}
          </p>
        </div>
        <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setTimeRange('week')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              timeRange === 'week'
                ? 'bg-white dark:bg-dark-card text-primary-600 shadow-sm'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            {i18n.language === 'ru' ? 'Неделя' : i18n.language === 'uz-Cyrl' ? 'Ҳафта' : 'Hafta'}
          </button>
          <button
            onClick={() => setTimeRange('month')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              timeRange === 'month'
                ? 'bg-white dark:bg-dark-card text-primary-600 shadow-sm'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            {i18n.language === 'ru' ? 'Месяц' : i18n.language === 'uz-Cyrl' ? 'Ой' : 'Oy'}
          </button>
          <button
            onClick={() => setTimeRange('all')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              timeRange === 'all'
                ? 'bg-white dark:bg-dark-card text-primary-600 shadow-sm'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            {i18n.language === 'ru' ? 'Все' : i18n.language === 'uz-Cyrl' ? 'Барчаси' : 'Barchasi'}
          </button>
        </div>
      </div>

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
                {i18n.language === 'ru' ? 'Уровень подготовки' : i18n.language === 'uz-Cyrl' ? 'Тайёргарлик даражаси' : 'Tayyorgarlik darajasi'}
              </p>
              <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-400 dark:to-blue-500 bg-clip-text text-transparent">
                {timeRange === 'all' ? (overall.preparationLevel || 0) : calculatePreparationLevel(period)}%
              </p>
            </div>
            <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl shadow-inner">
              <FiTrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
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
                {i18n.language === 'ru' ? 'Средний балл' : i18n.language === 'uz-Cyrl' ? 'Ўртача балл' : 'O\'rtacha ball'}
              </p>
              <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-700 dark:from-green-400 dark:to-green-500 bg-clip-text text-transparent">
                {Math.round(timeRange === 'all' ? (overall.averageScore || 0) : calculateAverageScore(period))}%
              </p>
            </div>
            <div className="p-3 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30 rounded-xl shadow-inner">
              <FiPercent className="w-6 h-6 text-green-600 dark:text-green-400" />
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
                {i18n.language === 'ru' ? 'Время' : i18n.language === 'uz-Cyrl' ? 'Вақт' : 'Vaqt'}
              </p>
              <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 dark:from-purple-400 dark:to-purple-500 bg-clip-text text-transparent">
                {formatDuration(timeRange === 'all' ? (overall.totalHoursSpent || 0) * 3600 : (period.totalTime || 0))}
              </p>
            </div>
            <div className="p-3 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30 rounded-xl shadow-inner">
              <FiClock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
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
                {i18n.language === 'ru' ? 'Решено тестов' : i18n.language === 'uz-Cyrl' ? 'Ечилган тестлар' : 'Yechilgan testlar'}
              </p>
              <p className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 dark:from-orange-400 dark:to-orange-500 bg-clip-text text-transparent">
                {timeRange === 'all' ? (overall.totalTests || 0) : (period.totalTests || 0)}
              </p>
            </div>
            <div className="p-3 bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/30 dark:to-orange-800/30 rounded-xl shadow-inner">
              <FiCheckCircle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Activity Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-2 bg-white dark:bg-dark-card rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {timeRange === 'week' ? (i18n.language === 'ru' ? 'Недельная активность' : i18n.language === 'uz-Cyrl' ? 'Ҳафталик фаоллик' : 'Haftalik faollik') : 
               timeRange === 'month' ? (i18n.language === 'ru' ? 'Месячная активность' : i18n.language === 'uz-Cyrl' ? 'Ойлик фаоллик' : 'Oylik faollik') : 
               (i18n.language === 'ru' ? 'Общая активность' : i18n.language === 'uz-Cyrl' ? 'Умумий фаоллик' : 'Umumiy faollik')}
            </h3>
            <FiActivity className="w-5 h-5 text-gray-400" />
          </div>
          <div className="h-64">
            {activityChartData ? (
              <Line data={activityChartData} options={chartOptions} />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                {i18n.language === 'ru' ? 'Нет данных' : i18n.language === 'uz-Cyrl' ? 'Маълумотлар йўқ' : 'Ma\'lumotlar yo\'q'}
              </div>
            )}
          </div>
        </motion.div>

        {/* Progress Donut Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white dark:bg-dark-card rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {i18n.language === 'ru' ? 'Статистика вопросов' : i18n.language === 'uz-Cyrl' ? 'Саволлар статистикаси' : 'Savollar statistikasi'}
            </h3>
            <FiTarget className="w-5 h-5 text-gray-400" />
          </div>
          <div className="h-48">
            {progressChartData ? (
              <Doughnut data={progressChartData} options={doughnutOptions} />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                {i18n.language === 'ru' ? 'Нет данных' : i18n.language === 'uz-Cyrl' ? 'Маълумотлар йўқ' : 'Ma\'lumotlar yo\'q'}
              </div>
            )}
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">{i18n.language === 'ru' ? 'Всего вопросов' : i18n.language === 'uz-Cyrl' ? 'Жами саволлар' : 'Jami savollar'}:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {totalQuestions}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">{i18n.language === 'ru' ? 'Правильные ответы' : i18n.language === 'uz-Cyrl' ? 'Тўғри жавоблар' : 'To\'g\'ri javoblar'}:</span>
              <span className="font-medium text-green-600 dark:text-green-400">
                {chartData.correctAnswers || 0}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">{i18n.language === 'ru' ? 'Неправильные ответы' : i18n.language === 'uz-Cyrl' ? 'Хато жавоблар' : 'Xato javoblar'}:</span>
              <span className="font-medium text-red-600 dark:text-red-400">
                {chartData.wrongAnswers || 0}
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Topics Progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-white dark:bg-dark-card rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {i18n.language === 'ru' ? 'Прогресс по темам' : i18n.language === 'uz-Cyrl' ? 'Мавзулар бўйича прогресс' : 'Mavzular bo\'yicha progress'}
          </h3>
          <FiBookOpen className="w-5 h-5 text-gray-400" />
        </div>
        <div className="h-64">
          {topicsChartData ? (
            <Bar data={topicsChartData} options={{
              ...chartOptions,
              indexAxis: 'y',
              scales: {
                ...chartOptions.scales,
                x: {
                  ...chartOptions.scales.x,
                  max: 100,
                },
              },
            }} />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Ma'lumotlar yo'q
            </div>
          )}
        </div>
      </motion.div>

      {/* Two columns for mistakes and recent tests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Mistakes */}
        {mostMistakes && mostMistakes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-white dark:bg-dark-card rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {i18n.language === 'ru' ? 'Часто ошибаются' : i18n.language === 'uz-Cyrl' ? 'Кўп хато қилинган саволлар' : 'Ko\'p xato qilingan savollar'}
              </h3>
              <FiAlertTriangle className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-3">
              {mostMistakes.slice(0, 5).map((topic, index) => (
                <div key={topic._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-3 flex-1">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </span>
                    <span className="text-sm text-gray-900 dark:text-white line-clamp-1">
                      {topic.question?.text?.[i18n.language] || topic.question?.text?.uz || topic.question?.text || (i18n.language === 'ru' ? 'Неизвестный вопрос' : i18n.language === 'uz-Cyrl' ? 'Номаълум савол' : 'Noma\'lum savol')}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-red-600 dark:text-red-400 ml-3">
                    {topic.count || 0} {i18n.language === 'ru' ? 'раз(а)' : i18n.language === 'uz-Cyrl' ? 'марта' : 'marta'}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Recent Tests */}
        {recentTests && recentTests.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="bg-white dark:bg-dark-card rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {i18n.language === 'ru' ? 'Последние тесты' : i18n.language === 'uz-Cyrl' ? 'Сўнгги тестлар' : 'So\'nggi testlar'}
              </h3>
              <FiCalendar className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-3">
              {recentTests.slice(0, 5).map((test) => (
                <div key={test._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {test.testType}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {safeFormatDate(test.completedAt || test.createdAt, 'dd.MM.yyyy HH:mm')}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      (test.percentage || test.score) >= 80
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                        : (test.percentage || test.score) >= 60
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                    }`}>
                      {test.percentage || test.score || 0}%
                    </span>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {test.timeTaken && !isNaN(test.timeTaken) 
                        ? `${Math.floor(test.timeTaken / 60)}:${String(test.timeTaken % 60).padStart(2, '0')}` 
                        : '-'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default StatisticsPage;