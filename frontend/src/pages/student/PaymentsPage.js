import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  FiCreditCard,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiCalendar,
  FiRefreshCw,
  FiX,
  FiShoppingCart,
  FiAward,
  FiStar,
  FiShield,
} from 'react-icons/fi';
import api from '../../services/api';
import toast from 'react-hot-toast';

const DEFAULT_FRONTEND_PLANS = [
  {
    id: '1_month',
    key: '1_month',
    name: "1 Oylik obuna",
    price: 45000,
    days: 30,
    durationDays: 30,
    type: 'premium',
    popular: false,
    badge: "🚀 Boshlang'ich reja",
    features: [
      "Barcha 1000+ test savollariga to'liq kirish",
      "Mavzular bo'yicha cheksiz test topshirish",
      "Haqiqiy YPX imtihon simulyatori (20 ta savol, 25 daqiqa)",
      "Barcha savollarning to'liq tahlili va izohlari",
      "Natijalar va xatolar ustida ishlash statistikasi",
    ],
  },
  {
    id: '2_months',
    key: '2_months',
    name: "2 Oylik obuna",
    price: 75000,
    days: 60,
    durationDays: 60,
    type: 'premium',
    popular: true,
    badge: "🌟 Tavsiya etiladi (Eng ommabop)",
    saving: "15 000 so'm tejamkorlik",
    features: [
      "Barcha 1 oylik imkoniyatlar",
      "60 kun davomida to'liq cheksiz foydalanish",
      "Kengaytirilgan xatolar banki va takrorlash rejimi",
      "Tezkor biletlar va tasodifiy testlar",
      "15 000 so'm tejamkorlik",
      "24/7 texnik qo'llab-quvvatlash",
    ],
  },
  {
    id: '3_months',
    key: '3_months',
    name: "3 Oylik obuna",
    price: 125000,
    days: 90,
    durationDays: 90,
    type: 'pro',
    popular: false,
    badge: "👑 VIP / Maksimal tayyorgarlik",
    features: [
      "Barcha premium va pro imkoniyatlar",
      "90 kun davomida cheksiz to'liq tayyorgarlik",
      "Imtihondan 100% o'tish uchun to'liq kurs bazasi",
      "Har bir mavzu bo'yicha chuqurlashtirilgan tahlil",
      "Barcha yangilanadigan yangi savollarga avtomatik kirish",
      "VIP maqom va ustuvor qo'llab-quvvatlash",
    ],
  },
];

const PaymentsPage = () => {
  const { t } = useTranslation();
  const { user } = useSelector((state) => state.auth);
  
  const [subscriptionTypes, setSubscriptionTypes] = useState(DEFAULT_FRONTEND_PLANS);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('click');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    fetchSubscriptionTypes();
    fetchPaymentHistory();
  }, []);

  const fetchSubscriptionTypes = async () => {
    try {
      const response = await api.get('/payments/subscription-types');
      if (response.data?.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
        setSubscriptionTypes(response.data.data);
      }
    } catch (error) {
      // Use fallback default plans
    }
  };

  const fetchPaymentHistory = async () => {
    try {
      const response = await api.get('/payments/history');
      setPaymentHistory(response.data.data || []);
    } catch (error) {
      // Error fetching payment history
    }
  };

  const handlePayment = async () => {
    if (!selectedPlan || !paymentMethod) {
      toast.error("Iltimos, to'lov usulini tanlang");
      return;
    }

    try {
      setProcessingPayment(true);
      const response = await api.post('/payments/create', {
        plan: selectedPlan.key || selectedPlan.id,
        paymentMethod: paymentMethod === 'cash' ? 'manual' : paymentMethod,
      });

      const { paymentUrl, paymentId } = response.data?.data || {};

      if (paymentMethod === 'cash') {
        toast.success("To'lov so'rovi yuborildi! Admin tasdiqlashi bilan obunangiz faollashadi.");
        setShowPaymentModal(false);
        fetchPaymentHistory();
      } else if (paymentUrl) {
        if (paymentUrl.includes('test=')) {
          const confirmTest = window.confirm("Test to'lovini muvaffaqiyatli yakunlashni xohlaysizmi?");
          if (confirmTest) {
            try {
              await api.post('/payments/test/complete', { paymentId });
              toast.success("To'lov muvaffaqiyatli amalga oshirildi!");
              setShowPaymentModal(false);
              fetchPaymentHistory();
              setTimeout(() => {
                window.location.reload();
              }, 1000);
            } catch (error) {
              toast.error("Test to'lovida xatolik yuz berdi");
            }
          }
          return;
        }
        
        window.open(paymentUrl, '_blank', 'width=800,height=600');
        
        const checkPaymentStatus = setInterval(async () => {
          try {
            const statusResponse = await api.get(`/payments/${paymentId}`);
            const paymentStatus = statusResponse.data?.data?.status;
            
            if (paymentStatus === 'completed') {
              clearInterval(checkPaymentStatus);
              toast.success("To'lov muvaffaqiyatli amalga oshirildi! Obunangiz faollashtirildi.");
              setShowPaymentModal(false);
              fetchPaymentHistory();
              setTimeout(() => {
                window.location.reload();
              }, 1000);
            } else if (paymentStatus === 'failed' || paymentStatus === 'cancelled') {
              clearInterval(checkPaymentStatus);
              toast.error("To'lov bekor qilindi yoki xatolik yuz berdi.");
              setShowPaymentModal(false);
              fetchPaymentHistory();
            }
          } catch (error) {
            // checking status
          }
        }, 3000);

        setTimeout(() => {
          clearInterval(checkPaymentStatus);
        }, 600000);
      } else {
        toast.success("To'lov tizimiga muvaffaqiyatli ulandi");
        setShowPaymentModal(false);
        fetchPaymentHistory();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "To'lov yaratishda xatolik yuz berdi");
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
        text: "Kutilmoqda"
      },
      processing: { 
        bgClass: 'bg-blue-100 dark:bg-blue-900/20',
        textClass: 'text-blue-800 dark:text-blue-400',
        icon: FiClock, 
        text: "Jarayonda" 
      },
      completed: { 
        bgClass: 'bg-green-100 dark:bg-green-900/20',
        textClass: 'text-green-800 dark:text-green-400',
        icon: FiCheckCircle, 
        text: "To'langan" 
      },
      failed: { 
        bgClass: 'bg-red-100 dark:bg-red-900/20',
        textClass: 'text-red-800 dark:text-red-400',
        icon: FiAlertCircle, 
        text: "Bekor qilingan" 
      },
      cancelled: { 
        bgClass: 'bg-gray-100 dark:bg-gray-900/20',
        textClass: 'text-gray-800 dark:text-gray-400',
        icon: FiAlertCircle, 
        text: "Rad etilgan" 
      },
      refunded: { 
        bgClass: 'bg-purple-100 dark:bg-purple-900/20',
        textClass: 'text-purple-800 dark:text-purple-400',
        icon: FiAlertCircle, 
        text: "Qaytarilgan" 
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
    return new Intl.NumberFormat('uz-UZ').format(price) + ' ' + (t('common.currency') || "so'm");
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('uz-UZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPlanTitle = (planKey) => {
    if (planKey === '1_month') return "1 Oylik obuna";
    if (planKey === '2_months') return "2 Oylik obuna";
    if (planKey === '3_months') return "3 Oylik obuna";
    if (planKey === '15_days') return "15 Kunlik obuna";
    return planKey || "Obuna";
  };

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('student.payments.title') || "To'lovlar va Obuna"}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm">
            {t('student.payments.subtitle') || "O'zingizga mos tarifni tanlang va barcha testlarga to'liq kirish huquqiga ega bo'ling"}
          </p>
        </div>
        <button
          onClick={() => {
            fetchSubscriptionTypes();
            fetchPaymentHistory();
          }}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-sm"
        >
          <FiRefreshCw className="w-4 h-4 mr-2" />
          {t('student.payments.refresh') || "Yangilash"}
        </button>
      </div>

      {/* Current Subscription Status Banner */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 text-white p-6 shadow-xl"
      >
        <div className="absolute right-0 top-0 -mt-8 -mr-8 w-48 h-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-md">
              <FiCreditCard className="w-3.5 h-3.5 mr-1.5" />
              Joriy obuna holati
            </div>
            <h2 className="text-2xl font-bold">
              {user?.subscription?.isActive
                ? getPlanTitle(user?.subscription?.plan || user?.subscription?.type)
                : "Obuna faol emas"}
            </h2>
            <div className="flex items-center text-sm text-white/80">
              <FiCalendar className="w-4 h-4 mr-1.5" />
              <span>
                Tugash muddati:{' '}
                <strong className="text-white">
                  {user?.subscription?.endDate ? formatDate(user.subscription.endDate) : '-'}
                </strong>
              </span>
            </div>
          </div>

          <div>
            <span
              className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold shadow-sm ${
                user?.subscription?.isActive
                  ? 'bg-emerald-500 text-white'
                  : 'bg-white/20 text-white backdrop-blur-md'
              }`}
            >
              {user?.subscription?.isActive ? (
                <>
                  <FiCheckCircle className="w-4 h-4 mr-1.5" />
                  Faol obuna
                </>
              ) : (
                <>
                  <FiAlertCircle className="w-4 h-4 mr-1.5" />
                  Nofaol (Cheklangan kirish)
                </>
              )}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Subscription Plans Grid */}
      <div>
        <div className="text-center max-w-2xl mx-auto mb-8 space-y-2">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Tarif rejalari
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Avtomaktab imtihoniga professional tayyorgarlik uchun qulay muddatdagi tarifni tanlang
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {subscriptionTypes.map((plan, index) => {
            const isPopular = plan.popular || plan.key === '2_months' || plan.id === '2_months';
            const isPro = plan.type === 'pro' || plan.key === '3_months' || plan.id === '3_months';

            return (
              <motion.div
                key={plan.id || plan.key || index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative flex flex-col rounded-2xl bg-white dark:bg-dark-card transition-all duration-300 ${
                  isPopular
                    ? 'border-2 border-indigo-500 dark:border-indigo-500 shadow-xl shadow-indigo-500/10 ring-4 ring-indigo-500/10'
                    : isPro
                    ? 'border-2 border-purple-400 dark:border-purple-600/60 shadow-lg'
                    : 'border border-gray-200 dark:border-gray-800 shadow-md hover:shadow-lg'
                }`}
              >
                {/* Popular / Pro Badge */}
                {isPopular && (
                  <div className="absolute -top-3.5 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-1 rounded-full text-xs font-bold shadow-md flex items-center">
                    <FiStar className="w-3.5 h-3.5 mr-1" />
                    Eng ommabop (Tavsiya etiladi)
                  </div>
                )}
                {isPro && !isPopular && (
                  <div className="absolute -top-3.5 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-1 rounded-full text-xs font-bold shadow-md flex items-center">
                    <FiAward className="w-3.5 h-3.5 mr-1" />
                    Maksimal tayyorgarlik
                  </div>
                )}

                <div className="p-6 md:p-8 flex-1 flex flex-col justify-between">
                  {/* Plan Top: Name, Price, Duration */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {plan.name}
                      </h3>
                      {plan.key === '2_months' && (
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-300">
                          -15 000 so'm
                        </span>
                      )}
                    </div>

                    <div className="border-b border-gray-100 dark:border-gray-800 pb-5">
                      <div className="flex items-baseline">
                        <span className="text-3xl lg:text-4xl font-extrabold text-gray-900 dark:text-white">
                          {new Intl.NumberFormat('uz-UZ').format(plan.price)}
                        </span>
                        <span className="ml-1.5 text-sm font-medium text-gray-500 dark:text-gray-400">
                          so'm
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center">
                        <FiClock className="w-3.5 h-3.5 mr-1 text-gray-400" />
                        Amal qilish muddati: <strong className="ml-1 text-gray-700 dark:text-gray-300">{plan.durationDays || plan.days || 30} kun</strong>
                      </p>
                    </div>

                    {/* Features List */}
                    <div className="space-y-3 pt-2">
                      <div className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                        Tarif xususiyatlari:
                      </div>
                      <ul className="space-y-2.5">
                        {(plan.features && plan.features.length > 0
                          ? plan.features
                          : DEFAULT_FRONTEND_PLANS.find(p => p.key === plan.key)?.features || []
                        ).map((feat, fIdx) => (
                          <li key={fIdx} className="flex items-start text-sm text-gray-700 dark:text-gray-300">
                            <FiCheckCircle className="w-4 h-4 text-emerald-500 mr-2 flex-shrink-0 mt-0.5" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Purchase Button */}
                  <div className="pt-8">
                    <button
                      onClick={() => {
                        setSelectedPlan(plan);
                        setShowPaymentModal(true);
                      }}
                      className={`w-full py-3 px-4 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center shadow-md hover:shadow-lg ${
                        isPopular
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white'
                          : isPro
                          ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white'
                          : 'bg-gray-900 hover:bg-gray-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white'
                      }`}
                    >
                      <FiShoppingCart className="w-4 h-4 mr-2" />
                      Obuna bo'lish
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Payment History */}
      <div className="bg-white dark:bg-dark-card rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
            <FiClock className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
            To'lovlar tarixi
          </h2>
          <span className="text-xs text-gray-500">
            Jami {paymentHistory.length} ta to'lov
          </span>
        </div>

        <div className="p-6">
          {paymentHistory.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto text-gray-400">
                <FiCreditCard className="w-8 h-8" />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Hozircha to'lovlar mavjud emas
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {paymentHistory.map((payment) => (
                <motion.div
                  key={payment._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700/60 gap-3"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
                      <FiCreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">
                        {getPlanTitle(payment.plan || payment.subscriptionType)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(payment.createdAt)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between sm:justify-end sm:space-x-4">
                    <span className="font-bold text-gray-900 dark:text-white">
                      {formatPrice(payment.amount)}
                    </span>
                    {getStatusBadge(payment.status)}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Payment Selection Modal */}
      <AnimatePresence>
        {showPaymentModal && selectedPlan && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-dark-card rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100 dark:border-gray-800"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    To'lov usulini tanlang
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Xavfsiz va tezkor to'lov
                  </p>
                </div>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Plan Summary Card */}
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200 dark:border-blue-800/60 rounded-xl flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white">
                      {selectedPlan.name}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Amal qilish muddati: {selectedPlan.durationDays || selectedPlan.days || 30} kun
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">
                      {formatPrice(selectedPlan.price)}
                    </span>
                  </div>
                </div>

                {/* Payment Methods */}
                <div className="space-y-3">
                  <div className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                    To'lov tizimlari:
                  </div>

                  {[
                    { id: 'click', name: 'Click Up', desc: "Click ilovasi yoki karta orqali to'lash", icon: '💳', color: 'blue' },
                    { id: 'payme', name: 'Payme', desc: "Payme ilovasi yoki karta orqali to'lash", icon: '💰', color: 'emerald' },
                    { id: 'cash', name: 'Naqd / Karta (Admin orqali)', desc: "Admin bilan bog'lanib faollashtirish", icon: '💵', color: 'amber' }
                  ].map((method) => (
                    <label
                      key={method.id}
                      className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        paymentMethod === method.id
                          ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 dark:border-blue-500'
                          : 'border-gray-200 dark:border-gray-700/80 hover:border-gray-300 dark:hover:border-gray-600'
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
                      <div className="flex-1">
                        <p className="font-bold text-gray-900 dark:text-white text-sm">
                          {method.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {method.desc}
                        </p>
                      </div>
                      {paymentMethod === method.id && (
                        <FiCheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 ml-2" />
                      )}
                    </label>
                  ))}
                </div>

                {/* Secure Payment Note */}
                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                  <FiShield className="w-4 h-4 mr-1.5 text-emerald-500" />
                  <span>To'lov 100% xavfsiz va shifrlangan protokol orqali amalga oshiriladi</span>
                </div>

                {/* Modal Buttons */}
                <div className="flex space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(false)}
                    disabled={processingPayment}
                    className="flex-1 btn-secondary py-3"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="button"
                    onClick={handlePayment}
                    disabled={processingPayment || !paymentMethod}
                    className="flex-1 btn-primary py-3 flex items-center justify-center"
                  >
                    {processingPayment ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      "To'lovga o'tish"
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PaymentsPage;
