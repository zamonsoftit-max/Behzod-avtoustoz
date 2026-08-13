import React from 'react';
import { motion } from 'framer-motion';

const LoadingSpinner = ({ size = 'medium', fullScreen = false, text = '' }) => {
  const sizes = {
    small: 'w-4 h-4 border-2',
    medium: 'w-8 h-8 border-3',
    large: 'w-12 h-12 border-4',
  };

  const spinnerContent = (
    <div className="flex flex-col items-center justify-center">
      <motion.div
        className={`${sizes[size]} border-primary-200 border-t-primary-600 rounded-full`}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      />
      {text && (
        <p className="mt-4 text-gray-600 dark:text-gray-400 text-sm">{text}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 dark:bg-dark-bg/80 backdrop-blur-sm z-50 flex items-center justify-center">
        {spinnerContent}
      </div>
    );
  }

  return spinnerContent;
};

export default LoadingSpinner;