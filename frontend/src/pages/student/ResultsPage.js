import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FiAlertCircle,
} from 'react-icons/fi';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { getSafeImageUrl, handleImageError } from '../../utils/imageUtils';
import ticketStatisticsService from '../../services/ticketStatistics.service';
import testService from '../../services/test.service';

const ResultsPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    const fetchResult = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/tests/results/${id}`);
        
        if (!mounted) return;
        
        // Validate response structure
        if (!response?.data?.data || typeof response.data.data !== 'object') {
          throw new Error('Invalid response format');
        }
        
        // Validate required fields
        const requiredFields = ['percentage', 'correctAnswers', 'totalQuestions', 'timeTaken', 'questions'];
        const data = response.data.data;
        const missingFields = requiredFields.filter(field => !(field in data));
        
        if (missingFields.length > 0) {
          throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
        }
        
        if (mounted) {
          setResult(data);
          
          // Update ticket statistics if this is a ticket test
          
          // Check for ticket ID in different possible locations
          const ticketId = data.ticketId || data.ticket?._id || data.ticket;
          
          if (ticketId && data.correctAnswers !== undefined && data.totalQuestions) {
            
            // Update local storage (for backward compatibility)
            ticketStatisticsService.updateTicketStatistics(
              ticketId,
              data.correctAnswers,
              data.totalQuestions
            );
            
            // Save to backend
            try {
              const percentage = Math.round((data.correctAnswers / data.totalQuestions) * 100);
              const currentStats = ticketStatisticsService.getStatistics();
              const attempts = currentStats[ticketId]?.attempts || 1;
              
              await testService.saveTicketStatistics(ticketId, percentage, attempts);
            } catch (error) {
              // Don't show error to user, just log it
            }
          }
        }
      } catch (error) {
        if (!mounted) return;
        toast.error(error.message || t('student.results.errors.fetchResult'));
        navigate('/student');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };
    
    fetchResult();
    
    return () => {
      mounted = false;
    };
  }, [id, navigate, t]);

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <FiAlertCircle className="w-16 h-16 text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          {t('student.results.notFound')}
        </h2>
        <button
          onClick={() => navigate('/student')}
          className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors mt-4"
        >
          {t('student.results.backToHome')}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('student.results.title')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {t('student.results.testResults')} #{id}
        </p>
      </div>

      {/* Result summary */}
      <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t('student.results.title')}</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center border-2 border-gray-200 dark:border-gray-600">
            <div className="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-2">
              {(typeof result.percentage === 'number' && !isNaN(result.percentage) && isFinite(result.percentage)) 
                ? result.percentage.toFixed(1) 
                : '0.0'}%
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">{t('student.results.percentage')}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center border-2 border-green-200 dark:border-green-600">
            <div className="text-2xl font-semibold text-green-600 dark:text-green-400 mb-2">
              {result.correctAnswers}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">{t('student.results.correct')}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center border-2 border-red-200 dark:border-red-600">
            <div className="text-2xl font-semibold text-red-600 dark:text-red-400 mb-2">
              {result.totalQuestions - result.correctAnswers}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">{t('student.results.incorrect')}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <button 
            onClick={() => navigate('/student')} 
            className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors border-2 border-gray-300 dark:border-gray-600"
          >
            {t('student.results.backToHome')}
          </button>
          <button 
            onClick={() => navigate('/student/tests')} 
            className="flex-1 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors border-2 border-primary-700 dark:border-primary-500"
          >
            {t('student.results.tryAgain')}
          </button>
        </div>
      </div>

      {/* Test info */}
      <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t('student.results.testInfo')}
        </h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">{t('student.results.testType')}:</span>
            <span className="text-gray-900 dark:text-white font-medium">
              {result.testType === 'exam' ? t('student.results.testTypes.exam') : 
               result.testType === 'topic' ? t('student.results.testTypes.topic') :
               result.testType === 'ticket' ? t('student.results.testTypes.ticket') :
               result.testType === 'random' ? t('student.results.testTypes.random') :
               result.testType === 'wrong_answers' ? t('student.results.testTypes.wrongAnswers') :
               result.testType === 'my_wrong_answers' ? t('student.results.testTypes.myWrongAnswers') :
               t('student.results.testTypes.other')}
            </span>
          </div>
          {result.topic && (
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">{t('student.results.topic')}:</span>
              <span className="text-gray-900 dark:text-white font-medium">
                {result.topic?.name?.[i18n.language] || result.topic?.name?.uz || 'N/A'}
              </span>
            </div>
          )}
          {result.ticket && (
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">{t('student.results.ticket')}:</span>
              <span className="text-gray-900 dark:text-white font-medium">
                №{result.ticket?.number || 'N/A'}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">{t('student.results.startTime')}:</span>
            <span className="text-gray-900 dark:text-white font-medium">
              {result.startedAt 
                ? new Date(result.startedAt).toLocaleString('uz-UZ')
                : 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* Questions review */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('student.results.reviewAnswers')}</h3>
        {(result.questions || []).map((item, index) => {
          const isCorrect = item.isCorrect;
          return (
            <div key={item._id} className={`p-4 rounded-lg border-2 ${
              isCorrect 
                ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20' 
                : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
            }`}>
              <div className="flex items-start justify-between mb-2">
                <span className="font-medium text-gray-900 dark:text-white">
                  {t('student.results.details.question')} {index + 1}/{result.totalQuestions}
                </span>
                <span className={`text-sm font-medium ${
                  isCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  {isCorrect ? t('student.results.correct') : t('student.results.incorrect')}
                </span>
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-2">{item.question?.text?.[i18n.language] || item.question?.text?.uz || ''}</p>
              {item.question?.image && (
                <div className="mb-3 flex gap-4 items-start">
                  <img
                    src={getSafeImageUrl(item.question.image)}
                    alt="Question"
                    className="w-64 h-auto rounded-lg object-cover shadow-md flex-shrink-0"
                    style={{ maxHeight: '200px' }}
                    onError={handleImageError}
                  />
                  {item.question?.explanation && (
                    <div className="flex-1 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                      <p className="text-sm font-semibold text-blue-700 dark:text-blue-400 mb-1">{t('student.results.explanation')}:</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{item.question.explanation[i18n.language] || item.question.explanation.uz || ''}</p>
                    </div>
                  )}
                </div>
              )}
              {!item.question?.image && item.question?.explanation && (
                <div className="mb-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                  <p className="text-sm font-semibold text-blue-700 dark:text-blue-400 mb-1">{t('student.results.explanation')}:</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{item.question.explanation[i18n.language] || item.question.explanation.uz || ''}</p>
                </div>
              )}
              <div className="text-sm">
                <p className="text-gray-600 dark:text-gray-300">
                  {t('student.results.yourAnswer')}: <span className={isCorrect ? 'text-green-600' : 'text-red-600'}>
                    {item.selectedOption !== undefined && item.question?.options?.[item.selectedOption] 
                      ? (item.question.options[item.selectedOption].text?.[i18n.language] || item.question.options[item.selectedOption].text?.uz || '')
                      : t('student.results.noAnswer')}
                  </span>
                </p>
                {!isCorrect && (
                  <p className="text-gray-600 dark:text-gray-300 mt-1">
                    {t('student.results.correctAnswer')}: <span className="text-green-600">
                      {item.question?.options?.find(opt => opt.isCorrect)?.text?.[i18n.language] || 
                       item.question?.options?.find(opt => opt.isCorrect)?.text?.uz || ''}
                    </span>
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ResultsPage;
