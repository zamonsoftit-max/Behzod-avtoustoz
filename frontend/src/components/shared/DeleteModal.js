import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiTrash2, FiAlertTriangle } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';

const DeleteModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  loading = false
}) => {
  const { t } = useTranslation();
  
  const modalTitle = title || t('common.confirmDelete', "O'chirishni tasdiqlang");
  const modalDescription = description || t('common.confirmDeleteMessage', "Bu amalni qaytarib bo'lmaydi. Davom etishni xohlaysizmi?");

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={handleBackdropClick}
          />
          
          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              {/* Header */}
              <div className="bg-red-50 dark:bg-red-900/20 px-6 py-4">
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 dark:bg-red-900/40 rounded-full">
                  <FiAlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-center text-gray-900 dark:text-white">
                  {modalTitle}
                </h3>
                <p className="mt-2 text-sm text-center text-gray-600 dark:text-gray-300">
                  {modalDescription}
                </p>
              </div>
              
              {/* Actions */}
              <div className="flex gap-3 px-6 py-4 bg-gray-50 dark:bg-gray-800/50">
                <button
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('common.cancel', 'Bekor qilish')}
                </button>
                <button
                  onClick={onConfirm}
                  disabled={loading}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>{t('common.deleting', "O'chirilmoqda...")}</span>
                    </>
                  ) : (
                    <>
                      <FiTrash2 className="w-4 h-4" />
                      <span>{t('common.delete', "O'chirish")}</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default DeleteModal;