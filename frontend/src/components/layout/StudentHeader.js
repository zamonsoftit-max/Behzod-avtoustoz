import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiMenu,
  FiBell,
  FiGlobe,
  FiSun,
  FiMoon,
  FiLogOut,
  FiUser,
  FiChevronDown,
} from 'react-icons/fi';
import { logout } from '../../store/slices/authSlice';
import { format } from 'date-fns';
import userService from '../../services/user.service';
import { toast } from 'react-toastify';
import { sanitizeImageUrl, handleImageError } from '../../utils/imageUtils';

const StudentHeader = ({ setSidebarOpen }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { unreadCount, notifications } = useSelector((state) => state.notification);
  
  const [showProfile, setShowProfile] = useState(false);
  const [showLanguages, setShowLanguages] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.profile-dropdown') && !event.target.closest('.notifications-dropdown') && !event.target.closest('.language-dropdown')) {
        setShowProfile(false);
        setShowNotifications(false);
        setShowLanguages(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const changeLanguage = async (lng) => {
    try {
      await i18n.changeLanguage(lng);
      localStorage.setItem('language', lng);
      
      // Save to server if user is logged in
      if (user) {
        await userService.updateLanguage(lng);
      }
      
      setShowLanguages(false);
    } catch (error) {
      console.error('Error updating language:', error);
      toast.error(t('errors.updateLanguage'));
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  const languages = [
    { code: 'uz', name: 'O\'zbek', flag: 'uz', shortName: 'uz' },
    { code: 'uz-Cyrl', name: 'Ўзбек', flag: 'ўз', shortName: 'ўз' },
    { code: 'ru', name: 'Русский', flag: 'ru', shortName: 'ru' },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white dark:bg-dark-card border-b border-gray-200 dark:border-gray-700">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Mobile menu button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <FiMenu className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </button>

          <div className="flex-1" />

          {/* Right side buttons */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Notifications */}
            <div className="relative notifications-dropdown">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <FiBell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </button>

              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute right-0 mt-2 w-80 bg-white dark:bg-dark-card rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
                >
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                      {t('common.notifications')}
                    </h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {(() => {
                      const unreadNotifications = notifications?.filter(n => !n.isRead) || [];
                      
                      if (unreadNotifications.length > 0) {
                        return (
                          <div className="divide-y divide-gray-200 dark:divide-gray-700">
                            {unreadNotifications.slice(0, 3).map((notification) => (
                          <div
                            key={notification._id}
                            className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer ${
                              !notification.isRead ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                            }`}
                            onClick={() => {
                              navigate('/student/notifications');
                              setShowNotifications(false);
                            }}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                                  {notification.title?.[i18n.language] || notification.title?.uz || t('notifications.default_title')}
                                </h4>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                  {notification.message?.[i18n.language] || notification.message?.uz || ''}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                                  {notification.createdAt ? format(new Date(notification.createdAt), 'dd.MM.yyyy HH:mm') : ''}
                                </p>
                              </div>
                              {!notification.isRead && (
                                <div className="ml-2 w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></div>
                              )}
                            </div>
                          </div>
                        ))}
                          </div>
                        );
                      } else {
                        return (
                          <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                            {t('notifications.empty')}
                          </div>
                        );
                      }
                    })()}
                  </div>
                  <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => {
                        navigate('/student/notifications');
                        setShowNotifications(false);
                      }}
                      className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
                    >
                      {t('common.view_all')}
                    </button>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Language selector */}
            <div className="relative language-dropdown">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowLanguages(!showLanguages);
                }}
                className="flex items-center space-x-1 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer relative z-10"
              >
                <FiGlobe className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {languages.find(lang => lang.code === i18n.language)?.flag}
                </span>
                <FiChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400 hidden sm:block" />
              </button>

              <AnimatePresence>
                {showLanguages && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-48 bg-white dark:bg-dark-card rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden z-50"
                  >
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => changeLanguage(lang.code)}
                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                          i18n.language === lang.code
                            ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium'
                            : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <span className="flex items-center">
                          <span className="mr-2">{lang.flag}</span>
                          {lang.name}
                        </span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors hidden sm:block"
            >
              {theme === 'light' ? (
                <FiMoon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              ) : (
                <FiSun className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              )}
            </button>

            {/* Profile menu */}
            <div className="relative profile-dropdown">
              <button
                onClick={() => setShowProfile(!showProfile)}
                className="flex items-center space-x-2.5 px-3 py-1.5 rounded-full bg-blue-50/90 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-700/70 shadow-sm transition-all duration-200 hover:shadow"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-sm ring-2 ring-white dark:ring-gray-800">
                  {user?.profileImage ? (
                    <img
                      src={sanitizeImageUrl(user.profileImage)}
                      alt="Profile"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        handleImageError(e);
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML = `<div class="w-full h-full flex items-center justify-center"><span class="text-white font-semibold text-sm">${user?.fullName?.charAt(0).toUpperCase()}</span></div>`;
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {user?.fullName?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <span className="hidden md:block text-sm font-semibold text-blue-900 dark:text-blue-200">
                  {user?.fullName}
                </span>
                <FiChevronDown className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </button>

              <AnimatePresence>
                {showProfile && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-56 bg-white dark:bg-dark-card rounded-lg shadow-lg py-2 border border-gray-200 dark:border-gray-700"
                  >
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {user?.fullName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {user?.phoneNumber}
                      </p>
                    </div>
                    
                    <button
                      onClick={() => {
                        navigate('/student/profile');
                        setShowProfile(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center"
                    >
                      <FiUser className="mr-3" />
                      {t('navigation.profile')}
                    </button>
                    
                    <div className="border-t border-gray-200 dark:border-gray-700 mt-2 pt-2">
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center"
                      >
                        <FiLogOut className="mr-3" />
                        {t('common.logout')}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default StudentHeader;