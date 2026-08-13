import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiClock,
  FiChevronLeft,
  FiChevronRight,
  FiCheckCircle,
  FiAlertCircle,
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import testService from '../../services/test.service';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const DemoTestPage = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showCorrectAnswers, setShowCorrectAnswers] = useState({});
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState(null);
  const [questionStatuses, setQuestionStatuses] = useState({});
  const [navigationDirection, setNavigationDirection] = useState(0);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchDemoQuestions();
  }, []);

  // Keyboard navigation
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Prevent default F1 help behavior
      if (e.key === 'F1') {
        e.preventDefault();
      }
      
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'F2') {
        if (currentQuestion < questions.length - 1) {
          setNavigationDirection(1);
          setCurrentQuestion(currentQuestion + 1);
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'F1') {
        if (e.key === 'F1') {
          e.preventDefault();
        }
        if (currentQuestion > 0) {
          setNavigationDirection(-1);
          setCurrentQuestion(currentQuestion - 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentQuestion, questions.length]);

  useEffect(() => {
    let timer;
    if (!showResults) {
      timer = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [showResults]);

  // Auto submit when all questions are answered
  useEffect(() => {
    if (questions.length > 0 && Object.keys(answers).length === questions.length) {
      handleSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers, questions.length]);

  const fetchDemoQuestions = async () => {
    try {
      const response = await testService.getDemoQuestions();
      
      if (response.data && response.data.data && response.data.data.length > 0) {
        setQuestions(response.data.data);
      } else {
        throw new Error('No questions received');
      }
    } catch (error) {
      console.error('Error fetching demo questions:', error);
      toast.error(t('student.test.errors.fetchQuestions'));
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (questionId, optionIndex) => {
    setAnswers({
      ...answers,
      [questionId]: optionIndex
    });

    // Show if answer is correct or not
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

    // Auto move to next question after 1 second
    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setNavigationDirection(1);
        setCurrentQuestion(currentQuestion + 1);
      }
    }, 1000);
  };

  const handleSubmit = async () => {
    if (submitting) return;
    
    setSubmitting(true);
    try {
      const response = await testService.submitDemoTest({
        answers,
        timeTaken: timeElapsed
      });
      
      setResults(response.data.data);
      setShowResults(true);
    } catch (error) {
      console.error('Error submitting demo test:', error);
      toast.error(t('student.test.errors.submitTest'));
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleNavigateQuestion = (direction) => {
    if (direction === 'prev' && currentQuestion > 0) {
      setNavigationDirection(-1);
      setCurrentQuestion(currentQuestion - 1);
    } else if (direction === 'next' && currentQuestion < questions.length - 1) {
      setNavigationDirection(1);
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handleQuestionSelect = (index) => {
    setNavigationDirection(index > currentQuestion ? 1 : -1);
    setCurrentQuestion(index);
  };

  const getQuestionText = (question) => {
    const lang = i18n.language;
    return question.text[lang] || question.text['uz'];
  };

  const getOptionText = (option) => {
    const lang = i18n.language;
    return option.text[lang] || option.text['uz'];
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (showResults) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20 pb-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {/* Page header */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('demoTest.testResults')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {t('demoTest.demoTestResult')}
            </p>
          </div>

          {/* Result summary */}
          <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t('demoTest.testResults')}</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center border-2 border-gray-200 dark:border-gray-600">
                <div className="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-2">
                  {results.percentage.toFixed(1)}%
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">{t('demoTest.overallResult')}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center border-2 border-green-200 dark:border-green-600">
                <div className="text-2xl font-semibold text-green-600 dark:text-green-400 mb-2">
                  {results.correctAnswers}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">{t('demoTest.correctAnswers')}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center border-2 border-red-200 dark:border-red-600">
                <div className="text-2xl font-semibold text-red-600 dark:text-red-400 mb-2">
                  {results.wrongAnswers}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">{t('demoTest.wrongAnswers')}</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={() => navigate('/')} 
                className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors border-2 border-gray-300 dark:border-gray-600"
              >
                {t('demoTest.homePageButton')}
              </button>
              <button 
                onClick={() => navigate('/register')} 
                className="flex-1 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors border-2 border-primary-700 dark:border-primary-500"
              >
                {t('demoTest.registerButton')}
              </button>
            </div>
          </div>

          {/* Test info */}
          <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('demoTest.testInfo')}
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">{t('demoTest.testType')}:</span>
                <span className="text-gray-900 dark:text-white font-medium">
                  {t('demoTest.demo')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">{t('demoTest.totalQuestions')}:</span>
                <span className="text-gray-900 dark:text-white font-medium">
                  {questions.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">{t('demoTest.timeTaken')}:</span>
                <span className="text-gray-900 dark:text-white font-medium">
                  {formatTime(results.timeTaken || timeElapsed)}
                </span>
              </div>
            </div>
          </div>

          {/* Questions review */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('demoTest.answerAnalysis')}</h3>
            {questions.map((question, index) => {
              const result = results.results[question._id];
              const getExplanationText = (question) => {
                const lang = i18n.language;
                return question.explanation?.[lang] || question.explanation?.['uz'] || '';
              };
              return (
                <div key={question._id} className={`p-4 rounded-lg border-2 ${
                  result.isCorrect 
                    ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20' 
                    : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
                }`}>
                  <div className="flex items-start justify-between mb-2">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {t('demoTest.questionFormat', { current: index + 1, total: questions.length })}
                    </span>
                    <span className={`text-sm font-medium ${
                      result.isCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {result.isCorrect ? t('demoTest.correctAnswers') : t('demoTest.wrongAnswers')}
                    </span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 mb-2">{getQuestionText(question)}</p>
                  {question.image && (
                    <div className="mb-3 flex gap-4 items-start">
                      <img
                        src={question.image}
                        alt={`Savol ${index + 1}`}
                        className="w-64 h-auto rounded-lg object-cover shadow-md flex-shrink-0"
                        style={{ maxHeight: '200px' }}
                      />
                      {question.explanation && (
                        <div className="flex-1 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                          <p className="text-sm font-semibold text-blue-700 dark:text-blue-400 mb-1">{t('demoTest.explanation')}:</p>
                          <p className="text-sm text-gray-700 dark:text-gray-300">{getExplanationText(question)}</p>
                        </div>
                      )}
                    </div>
                  )}
                  {!question.image && question.explanation && (
                    <div className="mb-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                      <p className="text-sm font-semibold text-blue-700 dark:text-blue-400 mb-1">{t('demoTest.explanation')}:</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{getExplanationText(question)}</p>
                    </div>
                  )}
                  <div className="text-sm">
                    <p className="text-gray-600 dark:text-gray-300">
                      {t('demoTest.yourAnswer')}: <span className={result.isCorrect ? 'text-green-600' : 'text-red-600'}>
                        {result.userAnswer !== undefined ? getOptionText(question.options[result.userAnswer]) : t('demoTest.noAnswerGiven')}
                      </span>
                    </p>
                    {!result.isCorrect && (
                      <p className="text-gray-600 dark:text-gray-300 mt-1">
                        {t('demoTest.correctAnswer')}: <span className="text-green-600">
                          {getOptionText(question.options[result.correctAnswer])}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    );
  }

  const question = questions[currentQuestion];
  const isAnswered = answers[question?._id] !== undefined;
  const showAnswer = showCorrectAnswers[question?._id];

  if (!question) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20 pb-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Left side - Test info and stats */}
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div>
                <h1 className="text-base font-semibold text-gray-900 dark:text-white">
                  {t('demoTest.title')}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {t('demoTest.questionFormat', { current: currentQuestion + 1, total: questions.length })}
                </p>
              </div>
              
              {/* Answers count */}
              <div className="inline-flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-2">
                <FiCheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {t('demoTest.answersGivenFormat', { answered: Object.keys(answers).length, total: questions.length })}
                </span>
              </div>
            </div>
            
            {/* Right side - Timer and finish button */}
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-2 text-gray-600 dark:text-gray-400">
                <FiClock className="w-4 h-4" />
                <span className="font-mono font-semibold">
                  {formatTime(timeElapsed)}
                </span>
              </div>
              
              {/* Finish test button - always visible on desktop when all answered */}
              {Object.keys(answers).length === questions.length && (
                <button
                  onClick={() => handleSubmit()}
                  disabled={submitting}
                  className="hidden md:flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <LoadingSpinner size="small" />
                  ) : (
                    <>
                      <FiCheckCircle className="mr-2" />
                      {t('demoTest.finishTestButton')}
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>


        {/* Question content */}
        <div className="relative overflow-hidden">
          <AnimatePresence mode="wait" custom={navigationDirection}>
            <motion.div
              key={currentQuestion}
              custom={navigationDirection}
              initial={(direction) => ({ opacity: 0, x: direction === 1 ? 50 : -50 })}
              animate={{ opacity: 1, x: 0 }}
              exit={(direction) => ({ opacity: 0, x: direction === 1 ? -50 : 50 })}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="bg-white dark:bg-dark-card rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 md:p-6"
              style={{ position: 'relative' }}
            >
            <div className="h-full">
              <div className={`${question.image ? 'grid md:grid-cols-2 gap-8' : ''}`}>
                {question.image && (
                  <div className="flex items-center justify-center">
                    <img
                      src={question.image}
                      alt={`Savol ${currentQuestion + 1}`}
                      className="w-full h-auto rounded-lg object-cover shadow-md"
                      style={{ aspectRatio: '16/9' }}
                    />
                  </div>
                )}
                
                <div className={`${question.image ? 'max-w-xl' : 'max-w-3xl mx-auto w-full'}`}>
                  <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-5">
                    {getQuestionText(question)}
                  </h2>

                  <div className="space-y-3">
                    {question.options.map((option, index) => {
                const isSelected = answers[question._id] === index;
                const isCorrect = question.correctOption === index;
                const showOptionResult = showAnswer && (isSelected || isCorrect);
                
                return (
                  <button
                    key={index}
                    onClick={() => !isAnswered && handleAnswerSelect(question._id, index)}
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
                        {getOptionText(option)}
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

        {/* Question navigation dots */}
        <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3">
          <div className="flex flex-wrap justify-center gap-2">
            {questions.map((q, index) => {
              const questionId = q._id;
              const status = questionStatuses[questionId];
              const isActive = index === currentQuestion;
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

        {/* Navigation buttons - only on mobile */}
        <div className="flex md:hidden flex-col sm:flex-row items-center justify-between gap-4">
          <button
            onClick={() => handleNavigateQuestion('prev')}
            disabled={currentQuestion === 0}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto justify-center"
          >
            <FiChevronLeft className="mr-2" />
            <span>{t('demoTest.previousButton')}</span>
          </button>

          {currentQuestion === questions.length - 1 && Object.keys(answers).length === questions.length ? (
            <button
              onClick={() => handleSubmit()}
              disabled={submitting}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors flex items-center w-full sm:w-auto justify-center"
            >
              {submitting ? (
                <LoadingSpinner size="small" />
              ) : (
                <>
                  <FiCheckCircle className="mr-2" />
                  {t('demoTest.finishTestButton')}
                </>
              )}
            </button>
          ) : (
            <button
              onClick={() => handleNavigateQuestion('next')}
              disabled={currentQuestion === questions.length - 1}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto justify-center"
            >
              <span>{t('demoTest.nextButton')}</span>
              <FiChevronRight className="ml-2" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DemoTestPage;
