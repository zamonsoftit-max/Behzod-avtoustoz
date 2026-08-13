import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiAlertTriangle, FiX } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';

const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  type = "warning", // warning, danger, info
}) => {
  const { t } = useTranslation();
  
  // Use default values with translation
  const modalTitle = title || t('common.confirm');
  const modalMessage = message || t('common.confirmMessage');
  const modalConfirmText = confirmText || t('common.yes');
  const modalCancelText = cancelText || t('common.no');
  const colors = {
    warning: {
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      icon: 'text-yellow-600 dark:text-yellow-400',
      button: 'btn-primary',
    },
    danger: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      icon: 'text-red-600 dark:text-red-400',
      button: 'bg-red-600 hover:bg-red-700 text-white',
    },
    info: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      icon: 'text-blue-600 dark:text-blue-400',
      button: 'btn-primary',
    },
  };

  const currentColors = colors[type] || colors.warning;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white dark:bg-dark-card rounded-xl shadow-xl max-w-md w-full overflow-hidden">
              {/* Header */}
              <div className={`${currentColors.bg} px-6 py-4 flex items-center justify-between`}>
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${currentColors.bg}`}>
                    <FiAlertTriangle className={`w-6 h-6 ${currentColors.icon}`} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {modalTitle}
                  </h3>
                </div>
                <button
                  onClick={onClose}
                  className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <FiX className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              {/* Body */}
              <div className="px-6 py-4">
                <p className="text-gray-600 dark:text-gray-300">
                  {modalMessage}
                </p>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-end space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500 rounded-lg transition-colors font-medium"
                >
                  {modalCancelText}
                </button>
                <button
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className={`px-4 py-2 rounded-lg transition-colors ${currentColors.button}`}
                >
                  {modalConfirmText}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ConfirmModal;