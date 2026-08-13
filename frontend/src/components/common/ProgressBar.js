import React from 'react';
import { motion } from 'framer-motion';

const ProgressBar = ({ percentage = 0, showPercentage = true, height = 'h-3', className = '' }) => {
  // Determine color based on percentage
  const getColor = () => {
    if (percentage === 100) {
      return 'bg-green-500';
    } else if (percentage >= 80) {
      return 'bg-gradient-to-r from-blue-500 to-green-500';
    } else if (percentage >= 60) {
      return 'bg-gradient-to-r from-blue-400 to-blue-500';
    } else if (percentage >= 40) {
      return 'bg-blue-400';
    } else {
      return 'bg-blue-500';
    }
  };

  return (
    <div className={`w-full ${className}`}>
      <div className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full ${height} overflow-hidden`}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`${height} ${getColor()} rounded-full relative`}
        >
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
        </motion.div>
      </div>
      {showPercentage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-right mt-1"
        >
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {percentage}%
          </span>
        </motion.div>
      )}
    </div>
  );
};

export default ProgressBar;