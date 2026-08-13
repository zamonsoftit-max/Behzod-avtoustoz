import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { FiShield, FiClock } from 'react-icons/fi';
import LoadingSpinner from '../common/LoadingSpinner';

const SMSVerification = ({ 
  phoneNumber, 
  onVerify, 
  onResend, 
  onChangeNumber,
  loading = false,
  resendAttempts = 0 
}) => {
  const { t } = useTranslation();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [error, setError] = useState('');

  // Timer for resend functionality
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setCanResend(true);
    }
  }, [timer]);

  // Handle input change
  const handleChange = (index, value) => {
    if (value.length > 1) return; // Only single digit
    if (!/^\d*$/.test(value)) return; // Only numbers

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setError('');

    // Auto focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      if (nextInput) nextInput.focus();
    }

    // Auto submit when all digits entered
    if (newCode.every(digit => digit) && newCode.length === 6) {
      handleSubmit(newCode.join(''));
    }
  };

  // Handle backspace
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  // Handle paste
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const digits = pastedData.replace(/\D/g, '').slice(0, 6).split('');
    
    const newCode = [...code];
    digits.forEach((digit, index) => {
      if (index < 6) newCode[index] = digit;
    });
    setCode(newCode);

    if (newCode.every(digit => digit)) {
      handleSubmit(newCode.join(''));
    }
  };

  const handleSubmit = (codeString) => {
    if (codeString.length !== 6) {
      setError(t('auth.invalidCode'));
      return;
    }
    onVerify(codeString);
  };

  const handleResend = () => {
    setTimer(60);
    setCanResend(false);
    setCode(['', '', '', '', '', '']);
    onResend();
  };

  const formatPhone = (phone) => {
    return phone.replace(/(\d{2})(\d{3})(\d{2})(\d{2})/, '+998 $1 $2 $3 $4');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg"
        >
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto h-12 w-12 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mb-4">
              <FiShield className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {t('auth.verificationCode')}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
              {t('auth.codeSent')} <br />
              <span className="font-medium text-gray-900 dark:text-white">
                {formatPhone(phoneNumber)}
              </span>
            </p>
          </div>


          {/* Code Input */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
                {t('auth.enterCode')}
              </label>
              <div className="flex justify-between gap-2">
                {code.map((digit, index) => (
                  <input
                    key={index}
                    id={`code-${index}`}
                    type="text"
                    inputMode="numeric"
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={index === 0 ? handlePaste : undefined}
                    className={`
                      w-12 h-12 text-center text-lg font-semibold
                      border-2 rounded-lg transition-all duration-200
                      ${digit ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-300 dark:border-gray-600'}
                      ${error ? 'border-red-500' : ''}
                      focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                      dark:bg-gray-700 dark:text-white
                    `}
                    maxLength="1"
                  />
                ))}
              </div>
              {error && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                  {error}
                </p>
              )}
            </div>

            {/* Timer and Resend */}
            <div className="flex items-center justify-between">
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                <FiClock className="mr-2 h-4 w-4" />
                {timer > 0 ? (
                  <span>{Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}</span>
                ) : (
                  <span>{t('auth.codeExpired')}</span>
                )}
              </div>
              <button
                type="button"
                onClick={handleResend}
                disabled={!canResend || loading || resendAttempts >= 3}
                className={`text-sm font-medium transition-colors ${
                  canResend && !loading && resendAttempts < 3
                    ? 'text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300'
                    : 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                }`}
              >
                {resendAttempts >= 3 
                  ? t('auth.maxAttemptsReached')
                  : `${t('auth.resendCode')} ${resendAttempts > 0 ? t('auth.attemptsRemaining', { remaining: 3 - resendAttempts }) : ''}`
                }
              </button>
            </div>

            {/* Verify Button */}
            <button
              type="button"
              onClick={() => handleSubmit(code.join(''))}
              disabled={loading || !code.every(digit => digit)}
              className="w-full btn btn-primary"
            >
              {loading ? <LoadingSpinner size="small" /> : t('auth.verifyCode')}
            </button>

            {/* Change Number Link */}
            <button
              type="button"
              onClick={onChangeNumber}
              className="w-full text-center text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
            >
              {t('auth.sendToAnotherNumber')}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SMSVerification;
