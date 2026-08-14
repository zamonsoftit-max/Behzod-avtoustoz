import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiHome,
  FiBookOpen,
  FiBarChart2,
  FiCreditCard,
  FiUser,
  FiX,
} from 'react-icons/fi';
import { getSafeImageUrl, handleImageError } from '../../utils/imageUtils';

const StudentSidebar = ({ isOpen, setIsOpen }) => {
  const { t } = useTranslation();
  const user = useSelector((state) => state.auth.user);
  const displayName = user?.fullName || [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Foydalanuvchi';
  const avatarUrl = getSafeImageUrl(user?.avatar);

  const navigation = [
    { name: t('navigation.dashboard'), href: '/student', icon: FiHome },
    { name: t('navigation.tests'), href: '/student/tests', icon: FiBookOpen },
    { name: t('navigation.statistics'), href: '/student/statistics', icon: FiBarChart2 },
    { name: t('navigation.payments'), href: '/student/payments', icon: FiCreditCard },
    { name: t('navigation.profile'), href: '/student/profile', icon: FiUser },
  ];

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-dark-card transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:transform-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between px-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-primary-600 dark:text-primary-400">
              {t('common.appName')}
            </h2>
            <button
              onClick={() => setIsOpen(false)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <FiX className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} onError={handleImageError} className="h-full w-full object-cover" />
              ) : (
                <span className="text-lg font-semibold text-primary-600 dark:text-primary-400">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{displayName}</p>
              <p className="truncate text-xs text-gray-500 dark:text-gray-400">{user?.phoneNumber || ''}</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                end={item.href === '/student'}
                className={({ isActive }) => {
                  // Check if we're on a test page when checking for tests link
                  const isTestsActive = item.href === '/student/tests' && 
                    (isActive || window.location.pathname.startsWith('/student/test/'));
                  
                  return `flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                    isActive || isTestsActive
                      ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`;
                }}
              >
                <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                {item.name}
              </NavLink>
            ))}
          </nav>

          {/* Test buttons */}
          <div className="px-3 py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="space-y-2">
              <NavLink
                to="/student/test/random"
                className="block w-full bg-primary-600 hover:bg-primary-700 dark:bg-primary-600 dark:hover:bg-primary-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors text-sm text-center"
              >
                {t('tests.random_test')}
              </NavLink>
              <NavLink
                to="/student/test/exam"
                className="block w-full bg-primary-600 hover:bg-primary-700 dark:bg-primary-600 dark:hover:bg-primary-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors text-sm text-center"
              >
                {t('tests.exam')}
              </NavLink>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default StudentSidebar;
