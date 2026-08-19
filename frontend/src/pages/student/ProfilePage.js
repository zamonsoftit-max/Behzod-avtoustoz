import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  FiUser,
  FiPhone,
  FiCalendar,
  FiLock,
  FiGlobe,
  FiMoon,
  FiSun,
  FiCamera,
  FiEdit2,
  FiCheck,
  FiX,
  FiTrash2,
  FiAlertCircle,
  FiShield,
  FiMail,
  FiKey,
  FiCheckCircle,
} from 'react-icons/fi';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { 
  fetchUserProfile, 
  updateUserProfile, 
  uploadProfileImage,
  updateLanguage,
  updateTheme,
  deleteAccount 
} from '../../store/slices/userThunks';
import { updatePassword } from '../../store/slices/authSlice';
import { sanitizeImageUrl, handleImageError } from '../../utils/imageUtils';

const ProfilePage = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { profile, profileLoading, loading } = useSelector((state) => state.user);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [deletePassword, setDeletePassword] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedTheme, setSelectedTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    dispatch(fetchUserProfile());
  }, [dispatch]);

  useEffect(() => {
    if (profile) {
      setEditedName(profile.fullName || '');
    }
  }, [profile]);

  const handleEditToggle = () => {
    if (isEditing) {
      handleSaveProfile();
    } else {
      setIsEditing(true);
    }
  };

  const handleSaveProfile = async () => {
    if (!editedName.trim()) {
      toast.error(t('profile.errors.name_required'));
      return;
    }

    const result = await dispatch(updateUserProfile({ fullName: editedName }));
    if (updateUserProfile.fulfilled.match(result)) {
      setIsEditing(false);
      toast.success(t('profile.success.profile_updated'));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(t('profile.errors.image_too_large'));
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);

      handleImageUpload(file);
    }
  };

  const handleImageUpload = async (file) => {
    const result = await dispatch(uploadProfileImage(file));
    if (uploadProfileImage.fulfilled.match(result)) {
      toast.success(t('profile.success.image_uploaded'));
      setImagePreview(null);
    }
  };

  const handleLanguageChange = async (newLanguage) => {
    await i18n.changeLanguage(newLanguage);
    await dispatch(updateLanguage(newLanguage));
  };

  const handleThemeChange = async (newTheme) => {
    setSelectedTheme(newTheme);
    await dispatch(updateTheme(newTheme));
    
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handlePasswordChange = async () => {
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error(t('profile.errors.password_mismatch'));
      return;
    }

    if (passwords.newPassword.length < 6) {
      toast.error(t('profile.errors.password_too_short'));
      return;
    }

    const result = await dispatch(updatePassword({
      currentPassword: passwords.currentPassword,
      newPassword: passwords.newPassword,
    }));

    if (updatePassword.fulfilled.match(result)) {
      setShowPasswordModal(false);
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success(t('profile.success.password_updated'));
    }
  };

  const handleDeleteAccount = async () => {
    const result = await dispatch(deleteAccount(deletePassword));
    if (deleteAccount.fulfilled.match(result)) {
      window.location.href = '/login';
    }
  };

  if (profileLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const profileData = profile || user;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('profile.title')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {t('profile.subtitle')}
        </p>
      </div>

      {/* Profile Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 bg-white dark:bg-dark-card rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
            <FiUser className="w-5 h-5 mr-2 text-gray-400" />
            {t('profile.personal_info')}
          </h2>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Profile Image */}
            <div className="relative group">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 ring-4 ring-gray-100 dark:ring-gray-800">
                {imagePreview || profileData?.profileImage ? (
                  <img
                    src={imagePreview || sanitizeImageUrl(profileData.profileImage)}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    onError={handleImageError}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                    <FiUser className="w-16 h-16 text-gray-400" />
                  </div>
                )}
              </div>
              <label className="absolute bottom-0 right-0 bg-primary-600 text-white p-2.5 rounded-full cursor-pointer hover:bg-primary-700 transition-colors shadow-lg">
                <FiCamera className="w-5 h-5" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  disabled={loading}
                />
              </label>
            </div>

            {/* User Info */}
            <div className="flex-1 text-center sm:text-left">
              <div className="mb-4">
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      className="text-xl font-semibold bg-transparent border-b-2 border-primary-600 focus:outline-none text-gray-900 dark:text-white px-1 py-1"
                      autoFocus
                    />
                    <button
                      onClick={handleEditToggle}
                      className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                      disabled={loading}
                    >
                      <FiCheck className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setEditedName(profileData?.fullName || '');
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <FiX className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {profileData?.fullName}
                    </h2>
                    <button
                      onClick={handleEditToggle}
                      className="p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                      disabled={loading}
                    >
                      <FiEdit2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-2 text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <FiPhone className="w-4 h-4" />
                  <span>{profileData?.phoneNumber}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FiCalendar className="w-4 h-4" />
                  <span>
                    {t('profile.joined_date')}: {profileData?.createdAt && format(new Date(profileData.createdAt), 'dd.MM.yyyy')}
                  </span>
                </div>
                {profileData?.email && (
                  <div className="flex items-center gap-2">
                    <FiMail className="w-4 h-4" />
                    <span>{profileData.email}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-dark-card rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <FiShield className="w-5 h-5 mr-2 text-gray-400" />
            {t('profile.security')}
          </h3>
          <button
            onClick={() => setShowPasswordModal(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
            disabled={loading}
          >
            <FiKey className="w-5 h-5" />
            {t('profile.change_password')}
          </button>
        </motion.div>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Language Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-dark-card rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <FiGlobe className="w-5 h-5 mr-2 text-gray-400" />
            {t('profile.language_settings')}
          </h3>
          <div className="grid grid-cols-1 gap-3">
            {[
              { code: 'uz', name: "O'zbek (lotin)", flag: '🇺🇿', shortName: 'uz' },
              { code: 'uz-Cyrl', name: 'Ўзбек (кирилл)', flag: '🇺🇿', shortName: 'ўз' },
              { code: 'ru', name: 'Русский', flag: '🇷🇺', shortName: 'ru' },
            ].map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                  i18n.language === lang.code
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
                disabled={loading}
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-6">{lang.shortName}</span>
                  <span className="font-medium text-gray-900 dark:text-white">{lang.name}</span>
                </div>
                {i18n.language === lang.code && (
                  <FiCheckCircle className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                )}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Theme Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-dark-card rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            {selectedTheme === 'dark' ? (
              <FiMoon className="w-5 h-5 mr-2 text-gray-400" />
            ) : (
              <FiSun className="w-5 h-5 mr-2 text-gray-400" />
            )}
            {t('profile.theme_settings')}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleThemeChange('light')}
              className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                selectedTheme === 'light'
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
              disabled={loading}
            >
              <FiSun className="w-8 h-8 text-yellow-500" />
              <span className="font-medium text-gray-900 dark:text-white">{t('profile.light_theme')}</span>
            </button>
            <button
              onClick={() => handleThemeChange('dark')}
              className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                selectedTheme === 'dark'
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
              disabled={loading}
            >
              <FiMoon className="w-8 h-8 text-blue-600" />
              <span className="font-medium text-gray-900 dark:text-white">{t('profile.dark_theme')}</span>
            </button>
          </div>
        </motion.div>
      </div>

      {/* Danger Zone */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white dark:bg-dark-card rounded-lg shadow-sm border border-red-200 dark:border-red-900/30 p-6"
      >
        <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4 flex items-center">
          <FiAlertCircle className="w-5 h-5 mr-2" />
          {t('profile.danger_zone')}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {t('profile.delete_account_warning')}
        </p>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          disabled={loading}
        >
          <FiTrash2 className="w-4 h-4" />
          {t('profile.delete_account')}
        </button>
      </motion.div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-dark-card rounded-lg shadow-xl max-w-md w-full"
          >
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <FiLock className="w-5 h-5 mr-2" />
                {t('profile.change_password')}
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('profile.current_password')}
                </label>
                <input
                  type="password"
                  value={passwords.currentPassword}
                  onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('profile.new_password')}
                </label>
                <input
                  type="password"
                  value={passwords.newPassword}
                  onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('profile.confirm_new_password')}
                </label>
                <input
                  type="password"
                  value={passwords.confirmPassword}
                  onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-800"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3">
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                {t('profile.cancel')}
              </button>
              <button
                onClick={handlePasswordChange}
                className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                disabled={loading}
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mx-auto" />
                ) : (
                  t('profile.save')
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-dark-card rounded-lg shadow-xl max-w-md w-full"
          >
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-red-600 flex items-center">
                <FiAlertCircle className="w-5 h-5 mr-2" />
                {t('profile.delete_account')}
              </h3>
            </div>
            <div className="p-6">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {t('profile.delete_account_confirm')}
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('profile.confirm_delete_password')}
                </label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-800"
                  placeholder={t('common.password')}
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletePassword('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                {t('profile.cancel')}
              </button>
              <button
                onClick={handleDeleteAccount}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                disabled={loading || !deletePassword}
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mx-auto" />
                ) : (
                  t('profile.yes_delete')
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
