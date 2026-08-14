import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { FiUser, FiPhone, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { register as registerUser, verifyRegistration, resendRegistrationCode, clearError } from '../../store/slices/authSlice';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import SMSVerification from '../../components/auth/SMSVerification';

const RegisterPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading, error, isAuthenticated } = useSelector((state) => state.auth);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [smsStep, setSmsStep] = useState(false);
  const [registrationData, setRegistrationData] = useState(null);
  const [resendAttempts, setResendAttempts] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setFocus,
  } = useForm({
    defaultValues: {
      fullName: '',
      phoneNumber: '',
      password: '',
      confirmPassword: '',
    },
  });

  const password = watch('password');

  useEffect(() => {
    setFocus('fullName');
    return () => {
      dispatch(clearError());
    };
  }, [dispatch, setFocus]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/student');
    }
  }, [isAuthenticated, navigate]);

  const onSubmit = async (data) => {
    // Format phone number
    const formattedPhone = data.phoneNumber.replace(/\D/g, '');
    const phoneWithCode = formattedPhone.startsWith('998') 
      ? `+${formattedPhone}` 
      : `+998${formattedPhone}`;

    const nameParts = data.fullName.trim().split(/\s+/);
    const payload = {
      firstName: nameParts.shift() || '',
      lastName: nameParts.join(' '),
      phoneNumber: phoneWithCode,
      password: data.password,
    };
    setRegistrationData(payload);
    try {
      const result = await dispatch(registerUser(payload)).unwrap();
      if (result.requiresSms) {
        setSmsStep(true);
        setResendAttempts(0);
      }
    } catch (submitError) {
      // Redux thunk xatoni form toastida ko‘rsatadi.
    }
  };

  const handleVerify = async (code) => {
    try {
      await dispatch(verifyRegistration({ phoneNumber: registrationData.phoneNumber, code })).unwrap();
    } catch (verifyError) {
      // Redux thunk xatoni toast orqali ko‘rsatadi.
    }
  };

  const handleResend = async () => {
    if (!registrationData) return;
    try {
      await dispatch(resendRegistrationCode(registrationData.phoneNumber)).unwrap();
      setResendAttempts((value) => value + 1);
    } catch (resendError) {
      // Redux thunk xatoni toast orqali ko‘rsatadi.
    }
  };

  const formatPhoneNumber = (value) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length === 0) return '';
    if (numbers.length === 1) return numbers;
    if (numbers.length <= 2) return `${numbers.slice(0, 2)}`;
    if (numbers.length <= 5) return `${numbers.slice(0, 2)} ${numbers.slice(2)}`;
    if (numbers.length <= 7) return `${numbers.slice(0, 2)} ${numbers.slice(2, 5)} ${numbers.slice(5)}`;
    if (numbers.length <= 9) return `${numbers.slice(0, 2)} ${numbers.slice(2, 5)} ${numbers.slice(5, 7)} ${numbers.slice(7)}`;
    return `${numbers.slice(0, 2)} ${numbers.slice(2, 5)} ${numbers.slice(5, 7)} ${numbers.slice(7, 9)}`;
  };

  if (smsStep && registrationData) {
    return (
      <SMSVerification
        phoneNumber={registrationData.phoneNumber.replace(/^\+/, '')}
        onVerify={handleVerify}
        onResend={handleResend}
        onChangeNumber={() => { setSmsStep(false); setRegistrationData(null); }}
        loading={loading}
        resendAttempts={resendAttempts}
      />
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 dark:from-dark-bg dark:to-gray-900 px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full"
      >
        <div className="bg-white dark:bg-dark-card rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gradient mb-2">
              {t('common.appName')}
            </h1>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
              {t('auth.register.title')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {t('auth.register.subtitle')}
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label htmlFor="fullName" className="label">
                {t('auth.fullNameLabel') || t('common.fullName')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiUser className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="fullName"
                  {...register('fullName', {
                    required: t('auth.register.fullname_required'),
                    minLength: {
                      value: 3,
                      message: t('auth.register.fullname_min_length'),
                    },
                    pattern: {
                      value: /^[a-zA-Z\s\u0400-\u04FF']+$/,
                      message: t('auth.register.fullname_pattern'),
                    },
                  })}
                  className={`input pl-10 ${errors.fullName ? 'border-red-500' : ''}`}
                  placeholder={t('auth.register.full_name_placeholder')}
                />
              </div>
              {errors.fullName && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.fullName.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="phoneNumber" className="label">
                {t('common.phoneNumber') || 'Telefon raqami'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiPhone className="h-5 w-5 text-gray-400" />
                  <span className="ml-2 text-gray-600 dark:text-gray-300">+998 </span>
                </div>
                <input
                  type="tel"
                  id="phoneNumber"
                  {...register('phoneNumber', {
                    required: t('auth.register.phone_required'),
                    validate: (value) => {
                      const numbers = value.replace(/\D/g, '');
                      if (numbers.length !== 9) {
                        return t('auth.register.phone_pattern');
                      }
                      return true;
                    },
                    onChange: (e) => {
                      const formatted = formatPhoneNumber(e.target.value);
                      e.target.value = formatted;
                    },
                  })}
                  className={`input pl-24 ${errors.phoneNumber ? 'border-red-500' : ''}`}
                  placeholder="90 123 45 67"
                  maxLength="12"
                />
              </div>
              {errors.phoneNumber && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.phoneNumber.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="label">
                {t('common.password') || 'Parol'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  {...register('password', {
                    required: t('auth.register.password_required'),
                    minLength: {
                      value: 6,
                      message: t('errors.validation.min_length', { min: 6 }) || 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak',
                    },
                    pattern: {
                      value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/,
                      message: t('auth.register.password_pattern') || 'Parol kamida bitta katta harf, bitta kichik harf va bitta raqam o\'z ichiga olishi kerak',
                    },
                  })}
                  className={`input pl-10 pr-10 ${errors.password ? 'border-red-500' : ''}`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <FiEyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                  ) : (
                    <FiEye className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="label">
                {t('auth.register.confirm_password_placeholder') || 'Parolni tasdiqlang'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  {...register('confirmPassword', {
                    required: t('auth.register.confirm_password_required'),
                    validate: (value) =>
                      value === password || t('auth.register.passwords_not_match'),
                  })}
                  className={`input pl-10 pr-10 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showConfirmPassword ? (
                    <FiEyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                  ) : (
                    <FiEye className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 flex items-center justify-center"
            >
              {loading ? (
                <LoadingSpinner size="small" />
              ) : (
                t('auth.registerButton')
              )}
            </button>

            <div className="text-center mt-6">
              <p className="text-gray-600 dark:text-gray-300">
                {t('auth.register.have_account')}{' '}
                <Link
                  to="/login"
                  className="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                >
                  {t('auth.loginButton')}
                </Link>
              </p>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
