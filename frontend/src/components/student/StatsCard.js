import React from 'react';
import { motion } from 'framer-motion';

const StatsCard = ({ icon, value, label, color = 'primary', delay = 0 }) => {
  const colorClasses = {
    primary: 'text-primary-600 dark:text-primary-400',
    green: 'text-green-600 dark:text-green-400',
    blue: 'text-blue-600 dark:text-blue-400',
    purple: 'text-purple-600 dark:text-purple-400',
    red: 'text-red-600 dark:text-red-400',
    yellow: 'text-yellow-600 dark:text-yellow-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white dark:bg-dark-card rounded-lg shadow-sm border border-gray-200 dark:border-dark-border p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`${colorClasses[color]}`}>{icon}</div>
        <span className="text-2xl font-bold text-gray-900 dark:text-white">
          {value}
        </span>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
    </motion.div>
  );
};

export default StatsCard;