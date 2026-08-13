import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';
import { motion } from 'framer-motion';
import {
  FiSave,
  FiX,
  FiUser,
  FiPhone,
  FiCalendar,
  FiToggleLeft,
  FiToggleRight,
  FiKey,
  FiShield,
} from 'react-icons/fi';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ConfirmModal from '../../components/common/ConfirmModal';
import toast from 'react-hot-toast';
import { formatDate } from '../../utils/formatters';

const UserEditPage = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    isActive: true,
    role: 'student',
    subscription: {
      type: null,
      endDate: null,
      isActive: false,
    },
  });

  useEffect(() => {
    fetchUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/users/${id}`);
      
      const userData = response.data.data.user;
      setUser(userData);
      setFormData({
        fullName: userData.fullName || '',
        phoneNumber: userData.phoneNumber || '',
        isActive: userData.isActive !== undefined ? userData.isActive : true,
        role: userData.role || 'student',
        subscription: {
          type: userData.subscription?.type || null,
          endDate: userData.subscription?.endDate ? new Date(userData.subscription.endDate).toISOString().split('T')[0] : '',
          isActive: userData.subscription?.isActive || false,
        },
      });
    } catch (error) {
      toast.error(t('admin.users.messages.loadError'));
      navigate('/admin/users');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.fullName.trim()) {
      toast.error(t('admin.users.validation.fullNameRequired', 'Имя обязательно для заполнения'));
      return;
    }

    if (!formData.phoneNumber.trim()) {
      toast.error(t('admin.users.validation.phoneRequired', 'Телефон обязателен для заполнения'));
      return;
    }

    // Phone validation
    const phoneRegex = /^\+998[0-9]{9}$/;
    if (!phoneRegex.test(formData.phoneNumber)) {
      toast.error(t('admin.users.validation.phoneFormat', 'Неверный формат телефона (+998XXXXXXXXX)'));
      return;
    }

    try {
      setSaving(true);
      const dataToSend = {
        fullName: formData.fullName,
        phoneNumber: formData.phoneNumber,
        isActive: formData.isActive,
        role: formData.role,
      };

      // Only update subscription if dates are provided
      if (formData.subscription.endDate) {
        dataToSend.subscription = {
          type: formData.subscription.type,
          endDate: new Date(formData.subscription.endDate),
          isActive: formData.subscription.isActive,
        };
      }

      await api.put(`/admin/users/${id}`, dataToSend);
      // Show localized success message
      let successMessage;
      switch (i18n.language) {
        case 'ru':
          successMessage = 'Пользователь успешно обновлен';
          break;
        case 'uz':
          successMessage = 'Foydalanuvchi ma\'lumotlari yangilandi';
          break;
        case 'uz-Cyrl':
          successMessage = 'Фойдаланувчи маълумотлари янгиланди';
          break;
        default:
          successMessage = t('admin.users.messages.userUpdated') || 'User updated successfully';
      }
      toast.success(successMessage);
      navigate('/admin/users');
    } catch (error) {
      toast.error(t('admin.users.messages.updateError', 'Ошибка при обновлении пользователя'));
    } finally {
      setSaving(false);
    }
  };

  const handleResetPasswordClick = () => {
    setShowResetPasswordModal(true);
  };

  const handleResetPasswordConfirm = async () => {

    try {
      const response = await api.post(`/admin/users/${id}/reset-password`);
      
      // Show success message with new password in current language
      let successMessage;
      const newPassword = response.data.data.newPassword;
      
      switch (i18n.language) {
        case 'ru':
          successMessage = `Пароль успешно сброшен. Новый пароль: ${newPassword}`;
          break;
        case 'uz':
          successMessage = `Parol muvaffaqiyatli tiklandi. Yangi parol: ${newPassword}`;
          break;
        case 'uz-Cyrl':
          successMessage = `Парол муваффақиятли тикланди. Янги парол: ${newPassword}`;
          break;
        default:
          successMessage = `Password reset successfully. New password: ${newPassword}`;
      }
      
      toast.success(successMessage, {
        duration: 10000, // Show for 10 seconds so admin can copy the password
        style: {
          fontSize: '14px',
          fontFamily: 'monospace',
          whiteSpace: 'pre-wrap'
        }
      });

      // Also show info about notification sent to user
      let infoMessage;
      switch (i18n.language) {
        case 'ru':
          infoMessage = 'Пользователю отправлено уведомление с новым паролем';
          break;
        case 'uz':
          infoMessage = 'Foydalanuvchiga yangi parol haqida xabar yuborildi';
          break;
        case 'uz-Cyrl':
          infoMessage = 'Фойдаланувчига янги парол ҳақида хабар юборилди';
          break;
        default:
          infoMessage = 'User has been notified about the password reset';
      }
      
      toast.success(infoMessage, { duration: 5000 });

    } catch (error) {
      let errorMessage;
      switch (i18n.language) {
        case 'ru':
          errorMessage = 'Ошибка при сбросе пароля';
          break;
        case 'uz':
          errorMessage = 'Parolni tiklashda xatolik yuz berdi';
          break;
        case 'uz-Cyrl':
          errorMessage = 'Паролни тиклашда хатолик юз берди';
          break;
        default:
          errorMessage = 'Error resetting password';
      }
      toast.error(errorMessage);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 dark:text-gray-400">Foydalanuvchi topilmadi</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('admin.users.editUser', 'Редактировать пользователя')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            ID: {user._id}
          </p>
        </div>
        <button
          onClick={() => navigate('/admin/users')}
          className="btn-secondary flex items-center"
        >
          <FiX className="w-4 h-4 mr-2" />
          {t('common.back')}
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-6"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('admin.users.details.basicInfo')}
            </h3>

            <div>
              <label className="label">
                <FiUser className="inline mr-2" />
                {t('admin.users.fields.fullName')}
              </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="input"
                required
              />
            </div>

            <div>
              <label className="label">
                <FiPhone className="inline mr-2" />
                {t('admin.users.fields.phoneNumber')}
              </label>
              <input
                type="text"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                className="input"
                placeholder="+998XXXXXXXXX"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">{t('admin.users.fields.status')}</label>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                  className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                    formData.isActive
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                  }`}
                >
                  {formData.isActive ? (
                    <>
                      <FiToggleRight className="w-5 h-5 mr-2" />
                      {t('admin.users.status.active')}
                    </>
                  ) : (
                    <>
                      <FiToggleLeft className="w-5 h-5 mr-2" />
                      {t('admin.users.status.inactive')}
                    </>
                  )}
                </button>
              </div>

              <div>
                <label className="label">{t('admin.users.fields.role', 'Роль')}</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="input"
                >
                  <option value="student">{t('admin.users.roles.student', 'Студент')}</option>
                  <option value="admin">{t('admin.users.roles.admin')}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Subscription Information */}
          <div className="space-y-4 border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('admin.users.details.subscriptionInfo')}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">{t('admin.users.fields.subscriptionType')}</label>
                <select
                  value={formData.subscription.type || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    subscription: { ...formData.subscription, type: e.target.value }
                  })}
                  className="input"
                >
                  <option value="">{t('admin.users.messages.noSubscription')}</option>
                  <option value="15_days">{t('subscription.types.15_days')}</option>
                  <option value="1_month">{t('subscription.types.1_month')}</option>
                  <option value="3_months">{t('subscription.types.3_months')}</option>
                </select>
              </div>

              <div>
                <label className="label">
                  <FiCalendar className="inline mr-2" />
                  {t('admin.users.fields.endDate')}
                </label>
                <input
                  type="date"
                  value={formData.subscription.endDate || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    subscription: { ...formData.subscription, endDate: e.target.value }
                  })}
                  className="input"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            <div>
              <label className="label">{t('admin.users.fields.subscriptionStatus')}</label>
              <button
                type="button"
                onClick={() => setFormData({
                  ...formData,
                  subscription: { ...formData.subscription, isActive: !formData.subscription.isActive }
                })}
                className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                  formData.subscription.isActive
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                }`}
              >
                {formData.subscription.isActive ? (
                  <>
                    <FiToggleRight className="w-5 h-5 mr-2" />
                    {t('admin.users.subscription.active')}
                  </>
                ) : (
                  <>
                    <FiToggleLeft className="w-5 h-5 mr-2" />
                    {t('admin.users.subscription.inactive')}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Security Section */}
          <div className="space-y-4 border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <FiShield className="w-5 h-5 mr-2" />
              {t('admin.users.security.title', 'Xavfsizlik')}
            </h3>
            
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <h4 className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
                {t('admin.users.security.passwordReset', 'Parolni tiklash')}
              </h4>
              <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
                {t('admin.users.security.passwordResetDesc', 'Foydalanuvchi uchun yangi xavfsiz parol yaratiladi va unga bildirishnoma yuboriladi.')}
              </p>
              <button
                type="button" 
                onClick={handleResetPasswordClick}
                className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                title="Foydalanuvchi uchun yangi parol yaratish"
              >
                <FiKey className="w-4 h-4" />
                {t('admin.users.actions.reset_password', 'Parolni tiklash')}
              </button>
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-4 border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('admin.users.additionalInfo', 'Qo\'shimcha ma\'lumotlar')}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600 dark:text-gray-400">{t('admin.users.fields.registeredAt', 'Ro\'yxatdan o\'tgan')}:</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {formatDate(user.createdAt || user.registeredAt, 'full', i18n.language)}
                </p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">{t('admin.users.lastLogin', 'Oxirgi kirish')}:</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {formatDate(user.lastActive || user.lastLogin, 'full', i18n.language)}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 btn-primary flex items-center justify-center"
            >
              {saving ? (
                <LoadingSpinner size="small" />
              ) : (
                <>
                  <FiSave className="w-4 h-4 mr-2" />
                  {t('common.save', 'Saqlash')}
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => navigate('/admin/users')}
              className="flex-1 btn-secondary"
            >
              {t('common.cancel', 'Bekor qilish')}
            </button>
          </div>
        </form>
      </motion.div>
      
      {/* Password Reset Confirmation Modal */}
      <ConfirmModal
        isOpen={showResetPasswordModal}
        onClose={() => setShowResetPasswordModal(false)}
        onConfirm={handleResetPasswordConfirm}
        type="warning"
        title={(() => {
          switch (i18n.language) {
            case 'ru':
              return 'Сбросить пароль пользователя';
            case 'uz':
              return 'Foydalanuvchi parolini tiklash';
            case 'uz-Cyrl':
              return 'Фойдаланувчи паролини тиклаш';
            default:
              return 'Reset User Password';
          }
        })()}
        message={(() => {
          switch (i18n.language) {
            case 'ru':
              return `Вы действительно хотите сбросить пароль для пользователя "${user?.fullName}"? Будет создан новый случайный пароль, и пользователь получит уведомление.`;
            case 'uz':
              return `"${user?.fullName}" foydalanuvchisi uchun parolni tiklashni xohlaysizmi? Yangi tasodifiy parol yaratiladi va foydalanuvchiga bildirishnoma yuboriladi.`;
            case 'uz-Cyrl':
              return `"${user?.fullName}" фойдаланувчиси учун паролни тиклашни хоҳлайсизми? Янги тасодифий парол яратилади ва фойдаланувчига билдиришнома юборилади.`;
            default:
              return `Are you sure you want to reset the password for user "${user?.fullName}"? A new random password will be generated and the user will be notified.`;
          }
        })()}
        confirmText={(() => {
          switch (i18n.language) {
            case 'ru':
              return 'Сбросить пароль';
            case 'uz':
              return 'Parolni tiklash';
            case 'uz-Cyrl':
              return 'Паролни тиклаш';
            default:
              return 'Reset Password';
          }
        })()}
        cancelText={(() => {
          switch (i18n.language) {
            case 'ru':
              return 'Отмена';
            case 'uz':
              return 'Bekor qilish';
            case 'uz-Cyrl':
              return 'Бекор қилиш';
            default:
              return 'Cancel';
          }
        })()}
      />
    </div>
  );
};

export default UserEditPage;