import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import {
  FiBookOpen,
  FiAward,
  FiFileText,
  FiXCircle,
  FiAlertCircle,
  FiShuffle,
  FiZap,
  FiChevronRight,
  FiClock,
  FiCheckCircle,
  FiTarget,
  FiArrowLeft,
  FiList,
  FiLock,
  FiRefreshCw,
} from 'react-icons/fi';
import api from '../../services/api';
import toast from 'react-hot-toast';
import ProgressBar from '../../components/common/ProgressBar';
import ticketStatisticsService from '../../services/ticketStatistics.service';
import testService from '../../services/test.service';

const TestsPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [topics, setTopics] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [ticketStatistics, setTicketStatistics] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedTestType, setSelectedTestType] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [examSettings, setExamSettings] = useState({
    questionsCount: 20,
    timeLimit: 20,
    passingScore: 90
  });
  
  const isSubscriptionActive = user?.subscription?.isActive;

  useEffect(() => {
    // Only fetch data if user has active subscription
    if (isSubscriptionActive) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [isSubscriptionActive]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // First fetch topics, tickets, and public settings
      const [topicsRes, ticketsRes, settingsRes] = await Promise.all([
        api.get('/tests/topics'),
        api.get('/tests/tickets'),
        api.get('/public/settings'),
      ]);
      
      setTopics(topicsRes.data.data);
      setTickets(ticketsRes.data.data);
      
      // Set exam settings from public settings
      if (settingsRes.data.data.examSettings) {
        setExamSettings(settingsRes.data.data.examSettings);
      }
      
      // Get statistics from backend
      try {
        const statsRes = await testService.getTicketStatistics();
        const backendStats = statsRes.data || {};
        const statsMap = {};
        
        // Convert backend statistics to the expected format
        ticketsRes.data.data.forEach((ticket) => {
          const ticketStat = backendStats[ticket.number];
          if (ticketStat) {
            statsMap[ticket._id] = ticketStat.bestScore;
          } else {
            statsMap[ticket._id] = 0;
          }
        });
        
        setTicketStatistics(statsMap);
      } catch (error) {
        // Fallback to local statistics
        const localStats = ticketStatisticsService.getAllStatistics();
        const statsMap = {};
        
        // First, add local statistics
        localStats.forEach(stat => {
          statsMap[stat.ticketId] = stat.percentage;
        });
        
        // Then add 0% for tickets without statistics
        ticketsRes.data.data.forEach((ticket) => {
          if (!statsMap[ticket._id]) {
            statsMap[ticket._id] = 0;
          }
        });
        
        setTicketStatistics(statsMap);
      }
    } catch (error) {
      // Don't show error for 403 (subscription required) or when data fetch fails
      // The UI already shows that subscription is required
    } finally {
      setLoading(false);
    }
  };

  const refreshSettings = async () => {
    try {
      const settingsRes = await api.get('/public/settings');
      if (settingsRes.data.data.examSettings) {
        setExamSettings(settingsRes.data.data.examSettings);
        toast.success(t('student.tests.settingsRefreshed'));
      }
    } catch (error) {
      toast.error(t('student.tests.refreshError'));
    }
  };

  const testTypes = [
    {
      id: 'topic-training',
      title: t('student.tests.types.topicTraining.title'),
      icon: FiBookOpen,
      description: t('student.tests.types.topicTraining.description'),
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
      iconColor: 'text-blue-600 dark:text-blue-400',
      requiresSelection: 'topic',
    },
    {
      id: 'topic-exam',
      title: t('student.tests.types.topicExam.title'),
      icon: FiAward,
      description: t('student.tests.types.topicExam.description'),
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20',
      iconColor: 'text-purple-600 dark:text-purple-400',
      requiresSelection: 'topic',
    },
    {
      id: 'intermediate',
      title: t('student.tests.types.intermediate.title'),
      icon: FiTarget,
      description: t('student.tests.types.intermediate.description'),
      color: 'from-indigo-500 to-indigo-600',
      bgColor: 'bg-indigo-100 dark:bg-indigo-900/20',
      iconColor: 'text-indigo-600 dark:text-indigo-400',
      requiresSelection: null,
    },
    {
      id: 'ticket-training',
      title: t('student.tests.types.ticketTraining.title'),
      icon: FiFileText,
      description: t('student.tests.types.ticketTraining.description'),
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
      iconColor: 'text-green-600 dark:text-green-400',
      requiresSelection: 'ticket',
    },
    {
      id: 'wrong-answers',
      title: t('student.tests.types.wrongAnswers.title'),
      icon: FiXCircle,
      description: t('student.tests.types.wrongAnswers.description'),
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-100 dark:bg-red-900/20',
      iconColor: 'text-red-600 dark:text-red-400',
      requiresSelection: null,
    },
    {
      id: 'my-wrong-answers',
      title: t('student.tests.types.myWrongAnswers.title'),
      icon: FiAlertCircle,
      description: t('student.tests.types.myWrongAnswers.description'),
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/20',
      iconColor: 'text-orange-600 dark:text-orange-400',
      requiresSelection: null,
    },
    {
      id: 'random',
      title: t('student.tests.types.random.title'),
      icon: FiShuffle,
      description: t('student.tests.types.random.description'),
      color: 'from-pink-500 to-pink-600',
      bgColor: 'bg-pink-100 dark:bg-pink-900/20',
      iconColor: 'text-pink-600 dark:text-pink-400',
      requiresSelection: null,
    },
    {
      id: 'exam',
      title: t('student.tests.types.exam.title'),
      icon: FiZap,
      description: t('student.tests.types.exam.description'),
      color: 'from-yellow-500 to-yellow-600',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
      iconColor: 'text-yellow-600 dark:text-yellow-400',
      requiresSelection: null,
      isExam: true,
    },
  ];

  const handleTestTypeSelect = (testType) => {
    if (!isSubscriptionActive) {
      toast.error(t('student.tests.subscriptionRequired'), {
        duration: 3000,
      });
      return;
    }
    
    if (testType.requiresSelection) {
      setSelectedTestType(testType);
      setSelectedItem(null);
    } else {
      navigate(`/student/test/${testType.id}`);
    }
  };

  const handleItemSelect = (item) => {
    setSelectedItem(item);
  };

  const startTest = () => {
    if (selectedTestType && (selectedItem || !selectedTestType.requiresSelection)) {
      const params = new URLSearchParams();
      if (selectedTestType.requiresSelection === 'topic') {
        params.append('topicId', selectedItem._id);
      } else if (selectedTestType.requiresSelection === 'ticket') {
        params.append('ticketId', selectedItem._id);
      }
      navigate(`/student/test/${selectedTestType.id}?${params.toString()}`);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('student.tests.title')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {t('student.tests.selectTypeDescription')}
        </p>
      </div>

      {!selectedTestType ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {testTypes.map((type, index) => {
            const Icon = type.icon;
            return (
              <motion.div
                key={type.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex"
              >
                <div
                  onClick={() => handleTestTypeSelect(type)}
                  className={`w-full h-full bg-white dark:bg-dark-card rounded-lg shadow-sm border-2 p-6 text-left transition-all flex flex-col ${
                    !isSubscriptionActive 
                      ? 'border-gray-200 dark:border-gray-700 opacity-75 cursor-pointer' 
                      : 'border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-500 hover:shadow-md cursor-pointer'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-lg ${type.bgColor} flex items-center justify-center`}>
                      <Icon className={`w-6 h-6 ${type.iconColor}`} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {type.title}
                    </h3>
                    {type.isExam && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          refreshSettings();
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        title={t('student.tests.refreshSettings')}
                      >
                        <FiRefreshCw className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {type.description}
                  </p>
                  {type.isExam && (
                    <div className="space-y-1 mb-4">
                      <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                        <FiClock className="w-3 h-3 mr-1" />
                        <span>{examSettings.timeLimit || 20} {t('student.tests.minutesUnit')}</span>
                      </div>
                      <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                        <FiList className="w-3 h-3 mr-1" />
                        <span>{examSettings.questionsCount || 20} {t('student.tests.questions')}</span>
                      </div>
                      <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                        <FiTarget className="w-3 h-3 mr-1" />
                        <span>{examSettings.passingScore || 90}% {t('student.tests.passingScoreUnit')}</span>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-auto">
                    <span className={`text-sm font-medium ${
                      isSubscriptionActive 
                        ? 'text-primary-600 dark:text-primary-400' 
                        : 'text-gray-400 dark:text-gray-600'
                    }`}>
                      {isSubscriptionActive ? t('student.tests.startTest') : t('student.tests.subscriptionRequired')}
                    </span>
                    {isSubscriptionActive ? (
                      <FiChevronRight className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    ) : (
                      <FiLock className="w-5 h-5 text-gray-400 dark:text-gray-600" />
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Back button */}
          <button
            onClick={() => setSelectedTestType(null)}
            className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
          >
            <FiArrowLeft className="w-5 h-5 mr-2" />
            <span>{t('student.tests.back')}</span>
          </button>

          {/* Selected test type info */}
          <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center space-x-4">
              <div className={`w-16 h-16 rounded-lg ${selectedTestType.bgColor} flex items-center justify-center`}>
                <selectedTestType.icon className={`w-8 h-8 ${selectedTestType.iconColor}`} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {selectedTestType.title}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {selectedTestType.description}
                </p>
              </div>
            </div>
          </div>

          {/* Selection list */}
          {selectedTestType.requiresSelection === 'topic' && (
            <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t('student.tests.select_topic')}
                </h3>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <FiList className="w-4 h-4 mr-1" />
                  <span>{t('student.tests.topicsCount', { count: topics.length })}</span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {topics.map((topic) => (
                  <motion.button
                    key={topic._id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={() => handleItemSelect(topic)}
                    className={`p-4 rounded-lg border transition-all text-left ${
                      selectedItem?._id === topic._id
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {topic.name[i18n.language] || topic.name.uz}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {topic.questionCount} {t('student.tests.questions')}
                        </p>
                      </div>
                      {selectedItem?._id === topic._id && (
                        <FiCheckCircle className="w-5 h-5 text-primary-600 dark:text-primary-400 ml-3" />
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {selectedTestType.requiresSelection === 'ticket' && (
            <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t('student.tests.select_ticket')}
                </h3>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <FiList className="w-4 h-4 mr-1" />
                  <span>{t('student.tests.ticketsCount', { count: tickets.length })}</span>
                </div>
              </div>
              <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-3">
                {tickets.map((ticket) => (
                  <motion.div
                    key={ticket._id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative"
                  >
                    <button
                      onClick={() => handleItemSelect(ticket)}
                      className={`w-full aspect-square rounded-lg border-2 transition-all flex flex-col items-center justify-center p-2 ${
                        selectedItem?._id === ticket._id
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <span className="text-lg font-semibold mb-1">{ticket.number}</span>
                      <div className="w-full">
                        <ProgressBar 
                          percentage={ticketStatistics[ticket._id] || 0} 
                          showPercentage={false}
                          height="h-1.5"
                        />
                      </div>
                      <span className="text-xs mt-1">
                        {ticketStatistics[ticket._id] || 0}%
                      </span>
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Start test button */}
          {selectedItem && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-center"
            >
              <button
                onClick={startTest}
                className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-lg font-medium text-lg flex items-center transition-colors"
              >
                {t('student.tests.startTest')}
                <FiChevronRight className="ml-2 w-5 h-5" />
              </button>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
};

export default TestsPage;