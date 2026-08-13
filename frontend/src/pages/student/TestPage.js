import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiClock,
  FiChevronLeft,
  FiChevronRight,
  FiCheckCircle,
  FiAlertCircle,
} from 'react-icons/fi';
import api from '../../services/api';
import axios from 'axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { getSafeImageUrl, handleImageError } from '../../utils/imageUtils';
import offlineService from '../../services/offline.service';


const TestPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { type } = useParams();
  const [searchParams] = useSearchParams();
  
  // Force component to re-render when language changes
  const [, forceUpdate] = useState();
  
  useEffect(() => {
    const handleLanguageChange = () => {
      forceUpdate({});
    };
    
    i18n.on('languageChanged', handleLanguageChange);
    
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n]);
  
  
  
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showCorrectAnswers, setShowCorrectAnswers] = useState({});
  const [questionStatuses, setQuestionStatuses] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [testConfig, setTestConfig] = useState({});
  const [startTime] = useState(Date.now());
  const [serverTimeOffset, setServerTimeOffset] = useState(0);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [navigationDirection, setNavigationDirection] = useState(0);
  const abortControllerRef = React.useRef(null);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const fetchQuestions = useCallback(async () => {
    // Cancel previous request if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    const controller = new AbortController();
    abortControllerRef.current = controller;
    
    let endpoint = ''; // Define endpoint at the beginning of function
    
    try {
      setLoading(true);
      
      // Check if offline mode is needed
      if (!navigator.onLine) {
        // Try to load from offline storage
        const offlineQuestions = await offlineService.getOfflineQuestions(type);
        if (offlineQuestions.length > 0) {
          setQuestions(offlineQuestions);
          setIsOfflineMode(true);
          setTestConfig({
            testType: type,
            timeLimit: null, // Will be set dynamically from backend
            topicId: searchParams.get('topicId'),
            ticketId: searchParams.get('ticketId'),
          });
          setLoading(false);
          toast.info(t('student.test.offlineMode'));
          return;
        } else {
          toast.error(t('student.test.noOfflineData'));
          navigate('/student/tests');
          return;
        }
      }
      
      // Set endpoint based on test type
      switch (type) {
        case 'topic-training':
          const topicIdTraining = searchParams.get('topicId');
          if (!topicIdTraining) {
            toast.error(t('student.test.errors.missingTopicId'));
            navigate('/student/tests');
            return;
          }
          endpoint = `/tests/questions/topic/${topicIdTraining}`;
          break;
        case 'topic-exam':
          const topicIdExam = searchParams.get('topicId');
          if (!topicIdExam) {
            toast.error(t('student.test.errors.missingTopicId'));
            navigate('/student/tests');
            return;
          }
          endpoint = `/tests/questions/topic/${topicIdExam}?limit=20`;
          break;
        case 'ticket-training':
          const ticketId = searchParams.get('ticketId');
          if (!ticketId) {
            toast.error(t('student.test.errors.missingTicketId'));
            navigate('/student/tests');
            return;
          }
          endpoint = `/tests/questions/ticket/${ticketId}`;
          break;
        case 'random':
          endpoint = '/tests/questions/random?limit=50';
          break;
        case 'wrong-answers':
          endpoint = '/tests/questions/wrong-answers';
          break;
        case 'my-wrong-answers':
          endpoint = '/tests/questions/my-wrong-answers';
          break;
        case 'exam':
          endpoint = '/tests/questions/exam';
          break;
        case 'intermediate':
          endpoint = '/tests/questions/random?limit=30'; // intermediate uses 30 random questions
          break;
        default:
          endpoint = '/tests/questions/random';
      }

      const response = await api.get(endpoint, { 
        signal: controller.signal
      });
      
      // Check if response indicates no questions available
      if (response?.data?.success === false && response?.data?.message) {
        toast.error(response.data.message);
        navigate('/student/tests');
        return;
      }
      
      if (!response?.data?.data) {
        toast.error(t('errors.server'));
        throw new Error('Invalid response format');
      }
      
      const { data, testType, timeLimit, topicId, ticketId } = response.data;
      
      if (!Array.isArray(data) || data.length === 0) {
        toast.error(t('student.test.no_questions'));
        navigate('/student/tests');
        return;
      }
      
      setQuestions(data);
      setTestConfig({
        testType: testType || type,
        timeLimit: timeLimit || (type === 'topic-exam' ? 20 : type === 'random' ? 60 : type === 'my-wrong-answers' ? 15 : type === 'wrong-answers' ? 10 : type === 'intermediate' ? 35 : type === 'exam' ? 20 : null),
        topicId: topicId || null,
        ticketId: ticketId || null,
      });
      
      // Set time limit for different test types
      if (type === 'topic-exam') {
        setTimeLeft(20 * 60); // 20 minutes in seconds
      } else if (type === 'random') {
        setTimeLeft(60 * 60); // 60 minutes in seconds
      } else if (type === 'my-wrong-answers') {
        setTimeLeft(15 * 60); // 15 minutes in seconds
      } else if (type === 'wrong-answers') {
        setTimeLeft(10 * 60); // 10 minutes in seconds
      } else if (type === 'intermediate') {
        setTimeLeft(35 * 60); // 35 minutes in seconds
      } else if (type === 'exam' && timeLimit && typeof timeLimit === 'number') {
        setTimeLeft(timeLimit * 60); // Dynamic exam time limit from backend
      } else if (timeLimit && typeof timeLimit === 'number') {
        setTimeLeft(timeLimit * 60); // Convert minutes to seconds
        
        // Sync with server time for exam mode
        if (type === 'exam' && response.data.serverTime) {
          try {
            const serverTime = new Date(response.data.serverTime).getTime();
            if (!isNaN(serverTime)) {
              const clientTime = Date.now();
              setServerTimeOffset(serverTime - clientTime);
            } else {
              // Invalid server time received
              setServerTimeOffset(0);
            }
          } catch (err) {
            // Error parsing server time
            setServerTimeOffset(0);
          }
        }
      }
      setLoading(false);
    } catch (error) {
      setLoading(false);
      
      // Check if the error is from a canceled request
      if (axios.isCancel(error)) {
        // Ignore canceled requests
        return;
      }
      
      // Error fetching questions
      
      // Check for network errors
      if (!navigator.onLine) {
        toast.error(t('student.test.errors.networkError'));
      } else if (error.response?.status === 401) {
        toast.error(t('student.test.errors.authExpired'));
        navigate('/login');
      } else if (error.response?.status === 403) {
        toast.error(t('student.test.errors.subscriptionRequired'));
        navigate('/student/payments');
      } else if (error.response?.status === 400) {
        // This is handled above for wrong-answers, but just in case
        const errorMessage = error.response?.data?.message || t('student.test.errors.questionsNotFound');
        toast.error(errorMessage);
      } else if (error.response?.status === 404) {
        toast.error(t('student.test.errors.apiNotFound'));
        // API endpoint not found
      } else if (error.response?.status === 500) {
        toast.error(t('student.test.errors.serverError'));
        // Server error details
        toast.error(t('student.test.errors.serverDetails'));
      } else {
        const errorMessage = error.response?.data?.message || t('student.test.errors.generalError');
        toast.error(errorMessage);
      }
      
      navigate('/student/tests');
    }
  }, [type, searchParams, navigate, t]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Prevent default F1 help behavior
      if (e.key === 'F1') {
        e.preventDefault();
      }
      
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'F2') {
        if (currentQuestionIndex < questions.length - 1) {
          setNavigationDirection(1);
          setCurrentQuestionIndex(currentQuestionIndex + 1);
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'F1') {
        if (e.key === 'F1') {
          e.preventDefault();
        }
        if (currentQuestionIndex > 0) {
          setNavigationDirection(-1);
          setCurrentQuestionIndex(currentQuestionIndex - 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentQuestionIndex, questions.length]);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Auto submit when time runs out
          if (type === 'exam' || type === 'topic-exam' || type === 'random' || type === 'my-wrong-answers' || type === 'wrong-answers') {
            handleSubmitTest();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, type]);

  // Timer for elapsed time
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeElapsed((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleAnswerSelect = (questionId, optionIndex) => {
    // Don't allow changing answer once selected (like in demo)
    if (answers[questionId] !== undefined) return;
    
    setAnswers({
      ...answers,
      [questionId]: optionIndex,
    });

    // For training modes, show if answer is correct
    if (type !== 'exam' && type !== 'topic-exam') {
      const question = questions.find(q => q._id === questionId);
      const isCorrect = question.correctOption === optionIndex;
      
      setShowCorrectAnswers({
        ...showCorrectAnswers,
        [questionId]: {
          userAnswer: optionIndex,
          isCorrect
        }
      });

      // Update question status
      setQuestionStatuses({
        ...questionStatuses,
        [questionId]: isCorrect ? 'correct' : 'incorrect'
      });

      // Auto move to next question after 1 second (like demo)
      setTimeout(() => {
        if (currentQuestionIndex < questions.length - 1) {
          setNavigationDirection(1);
          setCurrentQuestionIndex(currentQuestionIndex + 1);
        }
      }, 1000);
    }
  };

  const handleNavigateQuestion = (direction) => {
    if (direction === 'prev' && currentQuestionIndex > 0) {
      setNavigationDirection(-1);
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    } else if (direction === 'next' && currentQuestionIndex < questions.length - 1) {
      setNavigationDirection(1);
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handleQuestionSelect = (index) => {
    setNavigationDirection(index > currentQuestionIndex ? 1 : -1);
    setCurrentQuestionIndex(index);
  };

  const handleSubmitTest = useCallback(async () => {
    if (submitting) return;

    const unansweredCount = questions.length - Object.keys(answers).length;
    if (unansweredCount > 0 && !showConfirmModal && type !== 'exam') {
      setShowConfirmModal(true);
      return;
    }

    try {
      setSubmitting(true);
      const safeOffset = typeof serverTimeOffset === 'number' && !isNaN(serverTimeOffset) ? serverTimeOffset : 0;
      const timeTaken = Math.floor((Date.now() + safeOffset - startTime) / 1000); // seconds

      if (isOfflineMode) {
        // Save offline test result
        const offlineResult = {
          testType: testConfig.testType || type,
          questions: questions.map(q => q._id),
          answers,
          timeTaken,
          topicId: testConfig.topicId,
          ticketId: testConfig.ticketId,
          completedAt: new Date().toISOString()
        };
        
        const savedResult = await offlineService.saveOfflineTestResult(offlineResult);
        if (savedResult) {
          toast.success(t('student.test.offlineResultSaved'));
          navigate('/student/tests');
        } else {
          toast.error(t('student.test.offlineSaveError'));
        }
      } else {
        // Prepare answers object with questionId as key
        // Note: answers already has questionId as key, not index
        const answersObject = {};
        Object.entries(answers).forEach(([questionId, selectedOption]) => {
          // Verify the question exists
          const question = questions.find(q => (q._id || q.id) === questionId);
          if (question) {
            answersObject[questionId] = selectedOption;
          }
        });

        // Map frontend test types to backend test types
        let backendTestType = type;
        switch(type) {
          case 'topic-training':
          case 'topic-exam':
            backendTestType = 'topic';
            break;
          case 'ticket-training':
            backendTestType = 'ticket';
            break;
          case 'wrong-answers':
            backendTestType = 'wrong_answers';
            break;
          case 'my-wrong-answers':
            backendTestType = 'my_wrong_answers';
            break;
          case 'intermediate':
            backendTestType = 'random'; // intermediate tests are random type
            break;
          default:
            // Keep as is for: random, exam
            break;
        }

        // Prepare submission data in the exact format backend expects
        const submissionData = {
          testType: backendTestType,
          questions: questions.map((q) => q._id || q.id), // Array of question IDs
          answers: answersObject, // Object with questionId as key and selectedOption as value
          timeTaken: Math.max(1, Math.floor(timeTaken || 1)) // Ensure positive integer in seconds
        };

        // Add topicId or ticketId if present and required
        if (backendTestType === 'topic') {
          const topicId = testConfig.topicId || searchParams.get('topicId');
          if (topicId) {
            submissionData.topicId = topicId;
          }
        } else if (backendTestType === 'ticket') {
          const ticketId = testConfig.ticketId || searchParams.get('ticketId');
          if (ticketId) {
            submissionData.ticketId = ticketId;
          }
        }

        // Submit test data
        const response = await api.post('/tests/submit', submissionData);

        if (response.data?.data?.testId) {
          const { testId } = response.data.data;
          navigate(`/student/results/${testId}`);
        } else {
          throw new Error('Invalid response from server');
        }
      }
    } catch (error) {
      // Error submitting test
      
      if (error.response?.status === 400) {
        const errorMessage = error.response?.data?.message || 'Test yuborishda xatolik';
        toast.error(errorMessage);
        
        // Submit error details logged
      } else if (error.response?.status === 401) {
        toast.error(t('student.test.errors.authExpired'));
        navigate('/login');
      } else if (!navigator.onLine) {
        toast.error(t('student.test.errors.networkError'));
      } else {
        toast.error(t('student.test.errors.submitTest'));
      }
    } finally {
      setSubmitting(false);
    }
  }, [answers, questions, testConfig, type, startTime, navigate, submitting, showConfirmModal, t, isOfflineMode, serverTimeOffset, searchParams]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds
      .toString()
      .padStart(2, '0')}`;
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <FiAlertCircle className="w-16 h-16 text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          {t('student.test.noQuestionsTitle')}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {t('student.test.noQuestionsMessage')}
        </p>
        <button
          onClick={() => navigate('/student/tests')}
          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
        >
          {t('student.test.backToTests')}
        </button>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  
  if (!currentQuestion) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <FiAlertCircle className="w-16 h-16 text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          {t('student.test.errorTitle')}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {t('student.test.errorMessage')}
        </p>
        <button
          onClick={() => navigate('/student/tests')}
          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
        >
          {t('student.test.backToTests')}
        </button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Left side - Test info and stats */}
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div>
              <h1 className="text-base font-semibold text-gray-900 dark:text-white">
                {type === 'topic-training' && t('student.tests.types.topicTraining.title')}
                {type === 'topic-exam' && t('student.tests.types.topicExam.title')}
                {type === 'ticket-training' && t('student.tests.types.ticketTraining.title')}
                {type === 'random' && t('student.tests.types.random.title')}
                {type === 'wrong-answers' && t('student.tests.types.wrongAnswers.title')}
                {type === 'my-wrong-answers' && t('student.tests.types.myWrongAnswers.title')}
                {type === 'exam' && t('student.tests.types.exam.title')}
                {type === 'intermediate' && t('student.tests.types.intermediate.title')}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {t('student.test.questionTitle', { current: currentQuestionIndex + 1, total: questions.length })}
              </p>
            </div>
            
            {/* Answers count */}
            <div className="inline-flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-2">
              <FiCheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {t('student.test.answeredCount', { answered: Object.keys(answers).length, total: questions.length })}
              </span>
            </div>
          </div>
          
          {/* Right side - Timer and finish button */}
          <div className="flex items-center gap-3">
            {timeLeft !== null ? (
              <div className={`inline-flex items-center space-x-2 rounded-lg px-4 py-2 ${
                timeLeft <= 60 
                  ? 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400' 
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
              }`}>
                <FiClock className="w-4 h-4" />
                <span className="font-mono font-semibold">
                  {formatTime(timeLeft)}
                </span>
              </div>
            ) : (
              <div className="inline-flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-2 text-gray-600 dark:text-gray-400">
                <FiClock className="w-4 h-4" />
                <span className="font-mono font-semibold">
                  {formatTime(timeElapsed)}
                </span>
              </div>
            )}
            
            {/* Finish test button - always visible on desktop */}
            <button
              onClick={() => handleSubmitTest()}
              disabled={submitting}
              className="hidden md:flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <LoadingSpinner size="small" />
              ) : (
                <>
                  <FiCheckCircle className="mr-2" />
                  {t('student.test.finishTest')}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Question navigation dots */}
      <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3">
        <div className="flex flex-wrap justify-center gap-2">
          {questions.map((q, index) => {
            const questionId = q._id;
            const status = questionStatuses[questionId];
            const isActive = index === currentQuestionIndex;
            const isAnswered = answers[questionId] !== undefined;
            
            return (
              <button
                key={index}
                onClick={() => handleQuestionSelect(index)}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors border-2 ${
                  isActive
                    ? 'bg-primary-600 text-white border-primary-600'
                    : status === 'correct'
                    ? 'bg-green-500 text-white border-green-500'
                    : status === 'incorrect'
                    ? 'bg-red-500 text-white border-red-500'
                    : isAnswered
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 border-green-300 dark:border-green-700'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 border-gray-300 dark:border-gray-600'
                }`}
              >
                {index + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* Question content */}
      <div className="relative overflow-hidden">
        <AnimatePresence mode="wait" custom={navigationDirection}>
          <motion.div
            key={currentQuestionIndex}
            custom={navigationDirection}
            initial={(direction) => ({ opacity: 0, x: direction === 1 ? 50 : -50 })}
            animate={{ opacity: 1, x: 0 }}
            exit={(direction) => ({ opacity: 0, x: direction === 1 ? -50 : 50 })}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="bg-white dark:bg-dark-card rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 md:p-6"
            style={{ position: 'relative' }}
          >
          <div className="h-full">
            <div className={`${currentQuestion.image ? 'grid md:grid-cols-2 gap-8' : ''}`}>
              {currentQuestion.image && (
                <div className="flex items-center justify-center">
                  <img
                    src={getSafeImageUrl(currentQuestion.image)}
                    alt={`Savol ${currentQuestionIndex + 1}`}
                    className="w-full h-auto rounded-lg object-cover shadow-md"
                    style={{ aspectRatio: '16/9' }}
                    onError={handleImageError}
                  />
                </div>
              )}
              
              <div className={`${currentQuestion.image ? 'max-w-xl' : 'max-w-3xl mx-auto w-full'}`}>
                <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-5">
                  {currentQuestion.text?.[i18n.language] || currentQuestion.text?.uz || currentQuestion.text || ''}
                </h2>

                <div className="space-y-3">
                  {currentQuestion.options.map((option, index) => {
                  const isSelected = answers[currentQuestion._id] === index;
                  const isCorrect = currentQuestion.correctOption === index;
                  const showAnswer = showCorrectAnswers[currentQuestion._id];
                  const showOptionResult = showAnswer && (isSelected || isCorrect);
                  const isAnswered = answers[currentQuestion._id] !== undefined;
                  
                  return (
                    <button
                      key={index}
                      onClick={() => handleAnswerSelect(currentQuestion._id, index)}
                      disabled={isAnswered}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                        showOptionResult && isCorrect
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                          : showOptionResult && isSelected && !isCorrect
                          ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                          : isSelected
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                      } ${isAnswered ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <div className="flex items-center">
                        <span className="text-gray-900 dark:text-white flex-1">
                          {option.text?.[i18n.language] || option.text?.uz || option.text || ''}
                        </span>
                        {showOptionResult && isCorrect && (
                          <FiCheckCircle className="w-5 h-5 text-green-600 ml-2 flex-shrink-0" />
                        )}
                        {showOptionResult && isSelected && !isCorrect && (
                          <FiAlertCircle className="w-5 h-5 text-red-600 ml-2 flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  );
                })}
                </div>
              </div>
            </div>
          </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation buttons - only on mobile */}
      <div className="flex md:hidden flex-col sm:flex-row items-center justify-between gap-4">
        <button
          onClick={() => handleNavigateQuestion('prev')}
          disabled={currentQuestionIndex === 0}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto justify-center"
        >
          <FiChevronLeft className="mr-2" />
          <span>{t('student.test.previous')}</span>
        </button>

        {currentQuestionIndex === questions.length - 1 ? (
          <button
            id="submit-test-btn"
            onClick={() => handleSubmitTest()}
            disabled={submitting}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors flex items-center w-full sm:w-auto justify-center"
          >
            {submitting ? (
              <LoadingSpinner size="small" />
            ) : (
              <>
                <FiCheckCircle className="mr-2" />
                {t('test.finishTest')}
              </>
            )}
          </button>
        ) : (
          <button
            onClick={() => handleNavigateQuestion('next')}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors flex items-center w-full sm:w-auto justify-center"
          >
            <span>{t('student.test.next')}</span>
            <FiChevronRight className="ml-2" />
          </button>
        )}
      </div>

      {/* Confirm submit modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowConfirmModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white dark:bg-dark-card rounded-lg p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {t('student.test.confirmSubmitTitle')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {t('student.test.confirmSubmitMessage', { count: questions.length - Object.keys(answers).length })}
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-medium transition-colors border border-gray-300 dark:border-gray-600"
                >
                  {t('student.test.cancelButton')}
                </button>
                <button
                  onClick={() => {
                    setShowConfirmModal(false);
                    handleSubmitTest();
                  }}
                  className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
                >
                  {t('student.test.continueButton')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TestPage;
