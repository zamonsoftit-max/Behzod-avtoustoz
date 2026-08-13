import React from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { motion } from 'framer-motion';

const Pagination = ({ currentPage, totalPages, onPageChange, showInfo = false, totalItems, itemsPerPage }) => {
  const generatePageNumbers = () => {
    const pages = [];
    const maxVisible = 7;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 4) {
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col items-center space-y-4">
      {showInfo && totalItems && (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Jami: <span className="font-medium">{totalItems}</span> ta
        </div>
      )}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center space-x-2"
      >
      <button
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="w-10 h-10 flex items-center justify-center rounded-lg transition-all hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed hover:transform hover:scale-105 text-gray-700 dark:text-gray-300"
      >
        <FiChevronLeft className="w-5 h-5" />
      </button>
      
      <div className="flex items-center space-x-1">
        {generatePageNumbers().map((page, index) => (
          <React.Fragment key={index}>
            {page === '...' ? (
              <span className="px-3 py-2 text-gray-500 dark:text-gray-400 select-none">...</span>
            ) : (
              <button
                onClick={() => handlePageChange(page)}
                className={`min-w-[40px] h-10 px-3 flex items-center justify-center rounded-lg transition-all font-medium ${
                  currentPage === page
                    ? 'bg-primary-600 text-white shadow-lg transform scale-105'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 hover:transform hover:scale-105'
                }`}
              >
                {page}
              </button>
            )}
          </React.Fragment>
        ))}
      </div>
      
      <button
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="w-10 h-10 flex items-center justify-center rounded-lg transition-all hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed hover:transform hover:scale-105 text-gray-700 dark:text-gray-300"
      >
        <FiChevronRight className="w-5 h-5" />
      </button>
      </motion.div>
    </div>
  );
};

export default Pagination;