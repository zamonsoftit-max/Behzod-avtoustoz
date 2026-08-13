import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import {
  FiHome,
  FiUsers,
  FiFileText,
  FiBookOpen,
  FiDollarSign,
  FiBarChart2,
  FiSettings,
  FiLogOut,
  FiMenu,
  FiX,
  FiBell,
  FiMoon,
  FiSun,
  FiChevronDown,
  FiGlobe,
} from 'react-icons/fi';
import { logout } from '../../store/slices/authSlice';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import api from '../../services/api';

const AdminLayout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { user } = useSelector((state) => state.auth);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showLanguages, setShowLanguages] = useState(false);

  useEffect(() => {
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
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

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications?limit=5');
      const notificationData = response.data.data || [];
      const currentLanguage = i18n.language;
      
      // Filter out invalid notifications
      const validNotifications = notificationData.filter(notification => {
        const message = notification.message?.[currentLanguage] || notification.message?.uz || '';
        const title = notification.title?.[currentLanguage] || notification.title?.uz || '';
        
        // Skip notifications with translation keys as content
        return message !== 'notifications.empty' && title !== 'notifications.empty' &&
               message !== '' && title !== '';
      });
      
      setNotifications(validNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
    toast.success(t('auth.logout_success'));
  };

  const menuItems = [
    { path: '/admin', icon: FiHome, label: t('admin.dashboard.title') },
    { path: '/admin/users', icon: FiUsers, label: t('admin.users.title') },
    { path: '/admin/questions', icon: FiFileText, label: t('admin.questions.title') },
    { path: '/admin/topics', icon: FiBookOpen, label: t('admin.topics.title') },
    { path: '/admin/tickets', icon: FiFileText, label: t('admin.tickets.title') },
    { path: '/admin/payments', icon: FiDollarSign, label: t('admin.payments.title') },
    { path: '/admin/reports', icon: FiBarChart2, label: t('admin.reports.title') },
    { path: '/admin/settings', icon: FiSettings, label: t('admin.settings.title') },
  ];

  const languages = [
    { code: 'uz', name: 'O\'zbek', flag: '🇺🇿', shortName: 'UZ' },
    { code: 'uz-Cyrl', name: 'Ўзбек', flag: '🇺🇿', shortName: 'ЎЗ' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺', shortName: 'РУ' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-30 w-64 transform bg-white dark:bg-dark-card transition-transform duration-300 ease-in-out lg:translate-x-0 lg:transform-none ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between px-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-primary-600 dark:text-primary-400">
              Behzod Avtoustoz
            </h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <FiX className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/admin'}
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`
                  }
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>

          {/* User section */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center">
                <span className="text-primary-600 dark:text-primary-400 font-medium">
                  {user?.fullName?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {user?.fullName}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('common.admin')}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
                title={t('common.logout')}
              >
                <FiLogOut className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col min-h-screen lg:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-20 bg-white dark:bg-dark-card border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between h-16 px-4 lg:px-8">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <FiMenu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>

            <div className="flex-1" />

            <div className="flex items-center space-x-4">
              {/* Language selector */}
              <div className="relative language-dropdown">
                <button
                  onClick={() => setShowLanguages(!showLanguages)}
                  className="flex items-center space-x-1 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <FiGlobe className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {languages.find(lang => lang.code === i18n.language)?.shortName || 'UZ'}
                  </span>
                  <FiChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </button>

                {showLanguages && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute right-0 mt-2 w-48 bg-white dark:bg-dark-card rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
                  >
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={async () => {
                          await i18n.changeLanguage(lang.code);
                          localStorage.setItem('language', lang.code);
                          setShowLanguages(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                          i18n.language === lang.code
                            ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium'
                            : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <span className="flex items-center">
                          <span className="mr-3 text-lg">{lang.flag}</span>
                          {lang.name}
                        </span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </div>

              {/* Theme toggle */}
              <button
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                {theme === 'light' ? (
                  <FiMoon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                ) : (
                  <FiSun className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                )}
              </button>

              {/* Notifications */}
              <div className="relative notifications-dropdown">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <FiBell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  {notifications.filter(n => !n.isRead).length > 0 && (
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
                        {t('student.notifications.title')}
                      </h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map((notification) => {
                          // Get message and title
                          let notificationMessage = '';
                          let notificationTitle = '';
                          
                          // Handle message
                          if (notification.message) {
                            if (typeof notification.message === 'object') {
                              notificationMessage = notification.message[i18n.language] || 
                                                   notification.message.uz || 
                                                   notification.message.ru || '';
                            } else {
                              notificationMessage = notification.message;
                            }
                          }
                          
                          // Handle title
                          if (notification.title) {
                            if (typeof notification.title === 'object') {
                              notificationTitle = notification.title[i18n.language] || 
                                                 notification.title.uz || 
                                                 notification.title.ru || '';
                            } else {
                              notificationTitle = notification.title;
                            }
                          }
                          
                          
                          return (
                            <div
                              key={notification._id}
                              className={`p-4 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 ${
                                !notification.isRead ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                              }`}
                            >
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {notificationTitle}
                              </p>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                {notificationMessage}
                              </p>
                            </div>
                          );
                        }).filter(Boolean)
                      ) : (
                        <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                          {t('common.no_notifications')}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Profile dropdown */}
              <div className="relative profile-dropdown">
                <button
                  onClick={() => setShowProfile(!showProfile)}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center">
                    <span className="text-primary-600 dark:text-primary-400 font-medium text-sm">
                      {user?.fullName?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="hidden md:block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {user?.fullName}
                  </span>
                  <FiChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </button>

                {showProfile && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute right-0 mt-2 w-48 bg-white dark:bg-dark-card rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
                  >
                    <div className="p-2">
                      <div className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400">
                        {user?.email || user?.phone}
                      </div>
                      <hr className="my-1 border-gray-200 dark:border-gray-700" />
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
                      >
                        <FiLogOut className="w-4 h-4 mr-2" />
                        {t('common.logout')}
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default AdminLayout;
