import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { FiPhone, FiLock, FiEye, FiEyeOff, FiShield } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import SMSVerification from '../../components/auth/SMSVerification';

const ForgotPasswordPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('phone'); // 'phone', 'verify', 'password'
  const [phoneNumber, setPhoneNumber] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resendAttempts, setResendAttempts] = useState(0); // Track resend attempts

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm();

  const newPassword = watch('newPassword');

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

  // Step 1: Send code to phone
  const handleSendCode = async (data) => {
    try {
      setLoading(true);
      // Format phone number with +998 prefix
      const cleanPhone = data.phoneNumber.replace(/\D/g, '');
      const formattedPhone = cleanPhone.startsWith('998') 
        ? `+${cleanPhone}` 
        : `+998${cleanPhone}`;
      
      await api.post('/auth/forgot-password', {
        phoneNumber: formattedPhone,
      });

      setPhoneNumber(cleanPhone);
      setStep('verify');
      toast.success(t('auth.codeSent') || 'СМС код юборилди');
    } catch (error) {
      toast.error(error.response?.data?.message || t('errors.general') || 'Хатолик юз берди');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify SMS code
  const handleVerifyCode = async (code) => {
    try {
      setLoading(true);
      
      // Validate 6-digit code format
      if (!code || code.length !== 6 || !/^\d{6}$/.test(code)) {
        toast.error(t('auth.invalidCode') || 'Нотўғри код формати');
        return;
      }
      
      const formattedPhone = phoneNumber.startsWith('998') 
        ? `+${phoneNumber}` 
        : `+998${phoneNumber}`;
      
      // Verify code with backend
      await api.post('/auth/verify-code', {
        phoneNumber: formattedPhone,
        code: code,
      });
      
      // If verification successful, save code and move to password step
      setResetToken(code);
      setStep('password');
      toast.success(t('auth.codeVerified') || 'Код тасдиқланди');
    } catch (error) {
      toast.error(error.response?.data?.message || t('auth.invalidCode') || 'Нотўғри код');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset password
  const handleResetPassword = async (data) => {
    try {
      setLoading(true);
      const formattedPhone = phoneNumber.startsWith('998') 
        ? `+${phoneNumber}` 
        : `+998${phoneNumber}`;
      
      await api.post('/auth/reset-password', {
        phoneNumber: formattedPhone,
        code: data.code || resetToken,
        newPassword: data.newPassword,
      });

      toast.success(t('auth.passwordResetSuccess') || 'Парол муваффақиятли янгиланди');
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.message || t('errors.general') || 'Хатолик юз берди');
    } finally {
      setLoading(false);
    }
  };

  // Resend code
  const handleResendCode = async () => {
    try {
      // Check if already reached max attempts
      if (resendAttempts >= 3) {
        toast.error(t('auth.maxAttemptsReached') || 'Максимал уринишлар сонига етдингиз. 24 соат кутиб туринг.');
        return;
      }

      setLoading(true);
      const formattedPhone = phoneNumber.startsWith('998') 
        ? `+${phoneNumber}` 
        : `+998${phoneNumber}`;
      
      await api.post('/auth/forgot-password', {
        phoneNumber: formattedPhone,
      });

      // Update attempts count
      setResendAttempts(prev => prev + 1);

      toast.success(t('auth.codeSent') || 'СМС код қайта юборилди');
    } catch (error) {
      // Handle 429 (Too Many Requests) error
      if (error.response?.status === 429) {
        toast.error(error.response?.data?.message || t('auth.smsBlocked') || 'СМС юбориш блокланган');
      } else {
        toast.error(error.response?.data?.message || t('errors.general') || 'Хатолик юз берди');
      }
    } finally {
      setLoading(false);
    }
  };

  // Change phone number
  const handleChangeNumber = () => {
    setStep('phone');
    setPhoneNumber('');
    setResetToken('');
    reset();
  };

  // Render SMS verification step
  if (step === 'verify') {
    return (
      <SMSVerification
        phoneNumber={phoneNumber}
        onVerify={handleVerifyCode}
        onResend={handleResendCode}
        onChangeNumber={handleChangeNumber}
        loading={loading}
        resendAttempts={resendAttempts}
      />
    );
  }

  // Render phone input or password reset form
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
              {t('auth.resetPassword') || 'Паролни тиклаш'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {step === 'phone' 
                ? t('auth.enterPhone') || 'Телефон рақамингизни киритинг'
                : t('auth.enterNewPassword') || 'Янги паролни киритинг'
              }
            </p>
          </div>

          <form onSubmit={handleSubmit(step === 'phone' ? handleSendCode : handleResetPassword)} className="space-y-6">
            {step === 'phone' ? (
              <div>
                <label htmlFor="phoneNumber" className="label">
                  {t('common.phoneNumber') || 'Телефон рақами'}
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
                      required: t('errors.validation.phone') || 'Телефон рақами киритилиши шарт',
                      validate: (value) => {
                        const numbers = value.replace(/\D/g, '');
                        if (numbers.length !== 9) {
                          return t('errors.validation.phoneLength') || 'Телефон рақами 9 та рақамдан иборат бўлиши керак';
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
            ) : (
              <>
                {!resetToken && (
                  <div>
                    <label htmlFor="code" className="label">
                      {t('auth.verificationCode') || 'СМС код'}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiShield className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        id="code"
                        {...register('code', {
                          required: t('auth.codeRequired') || 'Код киритилиши шарт',
                          pattern: {
                            value: /^\d{6}$/,
                            message: t('auth.codeInvalidLength') || 'Код 6 та рақамдан иборат бўлиши керак',
                          },
                        })}
                        className={`input pl-10 ${errors.code ? 'border-red-500' : ''}`}
                        placeholder="123456"
                        maxLength="6"
                      />
                    </div>
                    {errors.code && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {errors.code.message}
                      </p>
                    )}
                  </div>
                )}
                
                <div>
                  <label htmlFor="newPassword" className="label">
                    {t('auth.newPassword') || 'Янги парол'}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiLock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      id="newPassword"
                      {...register('newPassword', {
                        required: t('errors.validation.required') || 'Парол киритилиши шарт',
                        minLength: {
                          value: 6,
                          message: t('errors.validation.min_length', { min: 6 }) || 'Парол камида 6 та белгидан иборат бўлиши керак',
                        },
                      })}
                      className={`input pl-10 pr-10 ${errors.newPassword ? 'border-red-500' : ''}`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showNewPassword ? (
                        <FiEyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                      ) : (
                        <FiEye className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                      )}
                    </button>
                  </div>
                  {errors.newPassword && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.newPassword.message}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="label">
                    {t('auth.confirmPassword') || 'Паролни тасдиқлаш'}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiLock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      {...register('confirmPassword', {
                        required: t('errors.validation.required') || 'Паролни тасдиқлаш шарт',
                        validate: (value) =>
                          value === newPassword || t('errors.validation.password_mismatch') || 'Пароллар мос келмаяпти',
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
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 flex items-center justify-center"
            >
              {loading ? (
                <LoadingSpinner size="small" />
              ) : (
                step === 'phone' ? (t('auth.sendCode') || 'Код юбориш') : (t('auth.updatePassword') || 'Паролни янгилаш')
              )}
            </button>

            <div className="text-center mt-6">
              <p className="text-gray-600 dark:text-gray-300">
                {t('auth.rememberPassword') || 'Паролингиз эсда қолдими?'}{' '} 
                <Link
                  to="/login"
                  className="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                >
                  {t('auth.loginButton') || 'Кириш'}
                </Link>
              </p>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPasswordPage;
