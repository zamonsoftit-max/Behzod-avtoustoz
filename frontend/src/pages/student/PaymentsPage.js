import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';
import {
  FiCreditCard,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiDollarSign,
  FiCalendar,
  FiRefreshCw,
  FiX,
  FiShoppingCart,
} from 'react-icons/fi';
import api from '../../services/api';
import toast from 'react-hot-toast';

const PaymentsPage = () => {
  const { t } = useTranslation();
  const { user } = useSelector((state) => state.auth);
  
  const [subscriptionTypes, setSubscriptionTypes] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);

  // Initial data load intentionally calls these component-local helpers.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchSubscriptionTypes();
    fetchPaymentHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSubscriptionTypes = async () => {
    try {
      const response = await api.get('/payments/subscription-types');
      setSubscriptionTypes(response.data.data);
    } catch (error) {
      // Error fetching subscription types
      toast.error(t('student.payments.errors.loadSubscriptions'));
    }
  };

  const fetchPaymentHistory = async () => {
    try {
      setLoading(true);
      const response = await api.get('/payments/history');
      setPaymentHistory(response.data.data);
    } catch (error) {
      // Error fetching payment history
      toast.error(t('student.payments.errors.loadPayments'));
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!selectedPlan || !paymentMethod) {
      toast.error(t('student.payments.errors.selectSubscriptionAndMethod'));
      return;
    }

    try {
      setProcessingPayment(true);
      const response = await api.post('/payments/create', {
        subscriptionType: selectedPlan.id,
        paymentMethod
      });

      const { paymentUrl, paymentId } = response.data.data;

      if (paymentMethod === 'cash') {
        toast.success(t('student.payments.errors.cashPaymentRequest'));
        setShowPaymentModal(false);
        fetchPaymentHistory();
      } else if (paymentUrl) {
        if (paymentUrl.includes('test=')) {
          const confirmTest = window.confirm(t('student.payments.errors.testPaymentComplete'));
          if (confirmTest) {
            try {
              await api.post('/payments/test/complete', { paymentId });
              toast.success(t('student.payments.errors.testPaymentSuccess'));
              setShowPaymentModal(false);
              fetchPaymentHistory();
              setTimeout(() => {
                window.location.reload();
              }, 1000);
            } catch (error) {
              // Test payment completion error
              toast.error(t('student.payments.errors.testPaymentError'));
            }
          }
          return;
        }
        
        window.open(paymentUrl, '_blank', 'width=800,height=600');
        
        const checkPaymentStatus = setInterval(async () => {
          try {
            const statusResponse = await api.get(`/payments/${paymentId}`);
            const paymentStatus = statusResponse.data.data.status;
            
            if (paymentStatus === 'completed') {
              clearInterval(checkPaymentStatus);
              toast.success(t('student.payments.errors.paymentSuccess'));
              setShowPaymentModal(false);
              fetchPaymentHistory();
              setTimeout(() => {
                window.location.reload();
              }, 1000);
            } else if (paymentStatus === 'failed' || paymentStatus === 'cancelled') {
              clearInterval(checkPaymentStatus);
              toast.error(t('student.payments.errors.paymentFailed'));
              setShowPaymentModal(false);
              fetchPaymentHistory();
            }
          } catch (error) {
            // Error checking payment status
          }
        }, 3000);

        setTimeout(() => {
          clearInterval(checkPaymentStatus);
        }, 600000);
      }
    } catch (error) {
      // Error creating payment
      toast.error(t('student.payments.errors.createPaymentError'));
    } finally {
      setProcessingPayment(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { 
        bgClass: 'bg-yellow-100 dark:bg-yellow-900/20',
        textClass: 'text-yellow-800 dark:text-yellow-400',
        icon: FiClock, 
        text: t('student.payments.status.pending') 
      },
      processing: { 
        bgClass: 'bg-blue-100 dark:bg-blue-900/20',
        textClass: 'text-blue-800 dark:text-blue-400',
        icon: FiClock, 
        text: t('student.payments.status.processing') 
      },
      completed: { 
        bgClass: 'bg-green-100 dark:bg-green-900/20',
        textClass: 'text-green-800 dark:text-green-400',
        icon: FiCheckCircle, 
        text: t('student.payments.status.completed') 
      },
      failed: { 
        bgClass: 'bg-red-100 dark:bg-red-900/20',
        textClass: 'text-red-800 dark:text-red-400',
        icon: FiAlertCircle, 
        text: t('student.payments.status.failed') 
      },
      cancelled: { 
        bgClass: 'bg-gray-100 dark:bg-gray-900/20',
        textClass: 'text-gray-800 dark:text-gray-400',
        icon: FiAlertCircle, 
        text: t('student.payments.status.cancelled') 
      },
      refunded: { 
        bgClass: 'bg-purple-100 dark:bg-purple-900/20',
        textClass: 'text-purple-800 dark:text-purple-400',
        icon: FiAlertCircle, 
        text: t('student.payments.status.refunded') 
      },
    };

    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.bgClass} ${badge.textClass}`}>
        <Icon className="w-3 h-3 mr-1" />
        {badge.text}
      </span>
    );
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('uz-UZ').format(price) + ' ' + t('common.currency');
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('uz-UZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && paymentHistory.length === 0) {
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
            {t('student.payments.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t('student.payments.subtitle')}
          </p>
        </div>
        <button
          onClick={fetchPaymentHistory}
          className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-dark-card border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <FiRefreshCw className="w-4 h-4 mr-2" />
          {t('student.payments.refresh')}
        </button>
      </div>

      {/* Current Subscription */}
      {user?.subscription && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2 flex items-center">
                <FiCreditCard className="w-5 h-5 mr-2" />
                {t('student.payments.subscriptionType')}
              </h3>
              <p className="text-white/90 text-xl font-medium">
                {user.subscription.type === '15_days' && (i18n.language === 'ru' ? '15 дневная подписка' : i18n.language === 'uz-Cyrl' ? '15 кунлик обуна' : '15 kunlik obuna')}
                {user.subscription.type === '1_month' && (i18n.language === 'ru' ? '1 месячная подписка' : i18n.language === 'uz-Cyrl' ? '1 ойлик обуна' : '1 oylik obuna')}
                {user.subscription.type === '3_months' && (i18n.language === 'ru' ? '3 месячная подписка' : i18n.language === 'uz-Cyrl' ? '3 ойлик обуна' : '3 oylik obuna')}
              </p>
              <p className="text-sm text-white/80 mt-2 flex items-center">
                <FiCalendar className="w-4 h-4 mr-1" />
                {t('student.payments.endDate')}: {user.subscription.endDate ? new Date(user.subscription.endDate).toLocaleDateString('ru-RU') : '-'}
              </p>
            </div>
            <div className="text-right">
              <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                user.subscription.isActive
                  ? 'bg-green-400/20 text-green-100 border border-green-400/30'
                  : 'bg-red-400/20 text-red-100 border border-red-400/30'
              }`}>
                {user.subscription.isActive ? (
                  <>
                    <FiCheckCircle className="w-4 h-4 mr-1" />
                    {t('admin.dashboard.status.active')}
                  </>
                ) : (
                  <>
                    <FiAlertCircle className="w-4 h-4 mr-1" />
                    {t('admin.dashboard.status.inactive')}
                  </>
                )}
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Subscription Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {subscriptionTypes.map((plan, index) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`bg-white dark:bg-dark-card rounded-lg shadow-sm border ${
              plan.id === '3_months'
                ? 'border-purple-500 ring-2 ring-purple-100 dark:ring-purple-900/30'
                : 'border-gray-200 dark:border-gray-700'
            } hover:shadow-md transition-all duration-200 overflow-hidden`}
          >
            {plan.id === '3_months' && (
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white text-center py-2 text-sm font-medium">
                🌟 {t('student.payments.bestChoice')}
              </div>
            )}
            
            <div className="p-5">
              <div className="text-center mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                  {plan.id === '15_days' && (i18n.language === 'ru' ? '15 дневная' : i18n.language === 'uz-Cyrl' ? '15 кунлик' : '15 kunlik')}
                  {plan.id === '1_month' && (i18n.language === 'ru' ? '1 месячная' : i18n.language === 'uz-Cyrl' ? '1 ойлик' : '1 oylik')}
                  {plan.id === '3_months' && (i18n.language === 'ru' ? '3 месячная' : i18n.language === 'uz-Cyrl' ? '3 ойлик' : '3 oylik')}
                </h3>
                <div className="flex items-center justify-center">
                  <FiDollarSign className="w-5 h-5 text-gray-400" />
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    {new Intl.NumberFormat('uz-UZ').format(plan.price)}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400 ml-1 text-sm">{t('common.currency')}</span>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-xs mt-1">
                  {t('student.payments.forDays', { days: plan.days })}
                </p>
              </div>
              
              <ul className="space-y-2 mb-4">
                <li className="flex items-start text-sm text-gray-600 dark:text-gray-400">
                  <FiCheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span>{t('student.payments.features.unlimitedTests')}</span>
                </li>
                <li className="flex items-start text-sm text-gray-600 dark:text-gray-400">
                  <FiCheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span>{t('student.payments.features.allTopics')}</span>
                </li>
                <li className="flex items-start text-sm text-gray-600 dark:text-gray-400">
                  <FiCheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span>{t('student.payments.features.fullStatistics')}</span>
                </li>
                <li className="flex items-start text-sm text-gray-600 dark:text-gray-400">
                  <FiCheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span>{t('student.payments.features.support')}</span>
                </li>
              </ul>
              
              <button
                onClick={() => {
                  setSelectedPlan(plan);
                  setShowPaymentModal(true);
                }}
                className={`w-full py-2.5 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center ${
                  plan.id === '3_months'
                    ? 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-md hover:shadow-lg'
                    : 'bg-primary-600 hover:bg-primary-700 text-white'
                }`}
              >
                <FiShoppingCart className="w-4 h-4 mr-2" />
                {t('student.payments.purchaseButton')}
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Payment History */}
      <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <FiClock className="w-5 h-5 mr-2 text-gray-400" />
            {t('student.payments.paymentHistory')}
          </h2>
        </div>

        <div className="p-6">
          {paymentHistory.length === 0 ? (
            <div className="text-center py-12">
              <FiCreditCard className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                {t('student.payments.noPayments')}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {paymentHistory.map((payment) => (
                <motion.div
                  key={payment._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                      <FiCreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {payment.subscriptionType === '15_days' && (i18n.language === 'ru' ? '15 дневная подписка' : i18n.language === 'uz-Cyrl' ? '15 кунлик обуна' : '15 kunlik obuna')}
                        {payment.subscriptionType === '1_month' && (i18n.language === 'ru' ? '1 месячная подписка' : i18n.language === 'uz-Cyrl' ? '1 ойлик обуна' : '1 oylik obuna')}
                        {payment.subscriptionType === '3_months' && (i18n.language === 'ru' ? '3 месячная подписка' : i18n.language === 'uz-Cyrl' ? '3 ойлик обуна' : '3 oylik obuna')}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(payment.createdAt)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right space-y-1">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {formatPrice(payment.amount)}
                    </p>
                    {getStatusBadge(payment.status)}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && selectedPlan && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => !processingPayment && setShowPaymentModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-dark-card rounded-lg shadow-xl max-w-md w-full"
            >
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {t('student.payments.choosePaymentMethod')}
                  </h3>
                  <button
                    onClick={() => setShowPaymentModal(false)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <FiX className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                    {selectedPlan.id === '15_days' && (i18n.language === 'ru' ? '15 дневная' : i18n.language === 'uz-Cyrl' ? '15 кунлик' : '15 kunlik')}
                    {selectedPlan.id === '1_month' && (i18n.language === 'ru' ? '1 месячная' : i18n.language === 'uz-Cyrl' ? '1 ойлик' : '1 oylik')}
                    {selectedPlan.id === '3_months' && (i18n.language === 'ru' ? '3 месячная' : i18n.language === 'uz-Cyrl' ? '3 ойлик' : '3 oylik')}
                  </h4>
                  <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                    {formatPrice(selectedPlan.price)}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {t('student.payments.forDays', { days: selectedPlan.days })}
                  </p>
                </div>

                <div className="space-y-3 mb-6">
                  {[
                    { id: 'click', name: t('student.payments.paymentMethods.click'), icon: '💳', color: 'blue' },
                    { id: 'payme', name: t('student.payments.paymentMethods.payme'), icon: '💰', color: 'green' },
                    { id: 'cash', name: t('student.payments.paymentMethods.cash'), icon: '💵', color: 'yellow' }
                  ].map((method) => (
                    <label
                      key={method.id}
                      className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        paymentMethod === method.id
                          ? `border-${method.color}-500 bg-${method.color}-50 dark:bg-${method.color}-900/20`
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method.id}
                        checked={paymentMethod === method.id}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="sr-only"
                      />
                      <span className="text-2xl mr-3">{method.icon}</span>
                      <span className="flex-1 font-medium text-gray-900 dark:text-white">
                        {method.name}
                      </span>
                      {paymentMethod === method.id && (
                        <FiCheckCircle className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                      )}
                    </label>
                  ))}
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowPaymentModal(false)}
                    disabled={processingPayment}
                    className="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    onClick={handlePayment}
                    disabled={processingPayment || !paymentMethod}
                    className="flex-1 py-3 px-4 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center"
                  >
                    {processingPayment ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      t('student.payments.pay')
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PaymentsPage;
