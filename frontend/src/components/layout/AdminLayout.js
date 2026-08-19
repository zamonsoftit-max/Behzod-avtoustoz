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
  FiUser,
  FiLock,
  FiEye,
  FiEyeOff,
  FiCheck,
} from 'react-icons/fi';
import { logout, updateUser } from '../../store/slices/authSlice';
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
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [adminName, setAdminName] = useState(user?.fullName || '');
  const [isSavingName, setIsSavingName] = useState(false);
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  useEffect(() => {
    if (user?.fullName) {
      setAdminName(user.fullName);
    }
  }, [user]);

  const handleSaveName = async (e) => {
    e.preventDefault();
    if (!adminName.trim()) {
      toast.error("Ism bo'sh bo'lishi mumkin emas");
      return;
    }
    try {
      setIsSavingName(true);
      const parts = adminName.trim().split(/\s+/);
      const firstName = parts[0] || '';
      const lastName = parts.slice(1).join(' ') || '';
      const response = await api.put('/users/profile', {
        fullName: adminName.trim(),
        firstName,
        lastName,
      });
      const updatedData = response.data.data || { fullName: adminName.trim(), firstName, lastName };
      dispatch(updateUser(updatedData));
      toast.success("Profil ma'lumotlari muvaffaqiyatli saqlandi");
    } catch (error) {
      toast.error(error.response?.data?.message || "Profilni yangilashda xatolik yuz berdi");
    } finally {
      setIsSavingName(false);
    }
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    if (passwords.newPassword.length < 6) {
      toast.error("Yangi parol kamida 6 ta belgidan iborat bo'lishi kerak");
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error("Yangi parollar bir-biriga mos kelmadi");
      return;
    }
    try {
      setIsSavingPassword(true);
      await api.put('/auth/update-password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      toast.success("Parol muvaffaqiyatli o'zgartirildi");
      setPasswords({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Parolni o'zgartirishda xatolik yuz berdi");
    } finally {
      setIsSavingPassword(false);
    }
  };

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
                  className="flex items-center space-x-2.5 px-3 py-1.5 rounded-full bg-blue-50/90 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-700/70 shadow-sm transition-all duration-200 hover:shadow"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-sm font-semibold text-sm ring-2 ring-white dark:ring-gray-800">
                    <span>
                      {user?.fullName?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="hidden md:block text-sm font-semibold text-blue-900 dark:text-blue-200">
                    {user?.fullName}
                  </span>
                  <FiChevronDown className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </button>

                {showProfile && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute right-0 mt-2 w-56 bg-white dark:bg-dark-card rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50"
                  >
                    <div className="p-3 bg-blue-50/50 dark:bg-blue-950/30 border-b border-gray-100 dark:border-gray-700/60">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                          {t('common.admin')}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1 truncate">
                        {user?.fullName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {user?.phoneNumber || user?.email}
                      </p>
                    </div>
                    <div className="p-1.5 space-y-1">
                      <button
                        onClick={() => {
                          setShowProfile(false);
                          setShowProfileModal(true);
                        }}
                        className="w-full flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-colors font-medium cursor-pointer"
                      >
                        <FiUser className="w-4 h-4 mr-2.5 text-blue-500" />
                        {t('navigation.profile') || 'Profil'}
                      </button>
                      <div className="border-t border-gray-100 dark:border-gray-700/60 my-1" />
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors font-medium cursor-pointer"
                      >
                        <FiLogOut className="w-4 h-4 mr-2.5" />
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

      {/* Admin Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="w-full max-w-lg bg-white dark:bg-dark-card rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden my-8"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-800/70">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
                  <FiUser className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    {t('navigation.profile') || 'Profil sozlamalari'}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Ism va parolni tahrirlash
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowProfileModal(false)}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[calc(85vh-120px)] overflow-y-auto">
              {/* Profile Info Form */}
              <form onSubmit={handleSaveName} className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-700">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center">
                    <FiUser className="w-4 h-4 mr-2 text-primary-500" />
                    Asosiy ma'lumotlar
                  </h4>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-medium">
                    {t('common.admin')}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {t('common.fullName') || 'To\'liq ism'}
                  </label>
                  <input
                    type="text"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    required
                    placeholder="Ismingizni kiriting"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {t('common.phoneNumber') || 'Telefon raqami'}
                  </label>
                  <input
                    type="text"
                    value={user?.phoneNumber || ''}
                    disabled
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                  />
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={isSavingName}
                    className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 rounded-xl shadow-sm hover:shadow transition-all flex items-center space-x-2 cursor-pointer"
                  >
                    {isSavingName ? (
                      <span>{t('common.loading') || 'Saqlanmoqda...'}</span>
                    ) : (
                      <>
                        <FiCheck className="w-4 h-4" />
                        <span>Ismni saqlash</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Password Change Form */}
              <form onSubmit={handleSavePassword} className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="pb-2 border-b border-gray-100 dark:border-gray-700">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center">
                    <FiLock className="w-4 h-4 mr-2 text-primary-500" />
                    Parolni o'zgartirish
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Xavfsizlik uchun parolingizni yangilab turing
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Joriy parol
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={passwords.currentPassword}
                      onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                      required
                      placeholder="Joriy parolingiz"
                      className="w-full px-3.5 py-2.5 pr-10 text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                    >
                      {showCurrentPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Yangi parol
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={passwords.newPassword}
                      onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                      required
                      minLength={6}
                      placeholder="Yangi parol (kamida 6 ta belgi)"
                      className="w-full px-3.5 py-2.5 pr-10 text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                    >
                      {showNewPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Yangi parolni tasdiqlash
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={passwords.confirmPassword}
                      onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                      required
                      minLength={6}
                      placeholder="Yangi parolni qayta kiriting"
                      className="w-full px-3.5 py-2.5 pr-10 text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                    >
                      {showConfirmPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={isSavingPassword}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded-xl shadow-sm hover:shadow transition-all flex items-center space-x-2 cursor-pointer"
                  >
                    {isSavingPassword ? (
                      <span>{t('common.loading') || 'Yangilanmoqda...'}</span>
                    ) : (
                      <>
                        <FiLock className="w-4 h-4" />
                        <span>Parolni yangilash</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}

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
