import React, { useState, useEffect, useRef } from 'react';
import DeleteModal from '../../components/shared/DeleteModal';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  FiPlus,
  FiEdit,
  FiTrash2,
  FiMove,
  FiEye,
  FiEyeOff,
  FiBookOpen,
  FiUpload,
  FiX,
} from 'react-icons/fi';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { sanitizeImageUrl, handleImageError } from '../../utils/imageUtils';

const TopicsPage = () => {
  const { t, i18n } = useTranslation();
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTopic, setEditingTopic] = useState(null);
  const [formData, setFormData] = useState({
    name: { uz: '', 'uz-Cyrl': '', ru: '' },
    description: { uz: '', 'uz-Cyrl': '', ru: '' },
    order: 0,
    isActive: true,
    image: null,
  });
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, topicId: null, loading: false });

  // Close modal on ESC key
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape' && showModal) {
        setShowModal(false);
        setEditingTopic(null);
        setImagePreview(null);
        setFormData({
          name: { uz: '', 'uz-Cyrl': '', ru: '' },
          description: { uz: '', 'uz-Cyrl': '', ru: '' },
          order: '',
          isActive: true,
          image: null,
        });
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [showModal]);

  useEffect(() => {
    fetchTopics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchTopics = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/topics');
      setTopics(response.data.data);
    } catch (error) {
      toast.error(t('admin.topics.errors.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (topic = null) => {
    if (topic) {
      setEditingTopic(topic);
      setFormData({
        name: topic.name,
        description: topic.description || { uz: '', 'uz-Cyrl': '', ru: '' },
        order: topic.order,
        isActive: topic.isActive,
        image: null,
      });
      setImagePreview(topic.image || null);
    } else {
      setEditingTopic(null);
      setFormData({
        name: { uz: '', 'uz-Cyrl': '', ru: '' },
        description: { uz: '', 'uz-Cyrl': '', ru: '' },
        order: '',
        isActive: true,
        image: null,
      });
      setImagePreview(null);
    }
    setShowModal(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(t('admin.topics.errors.imageSizeError'));
        return;
      }
      
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        toast.error(t('admin.topics.errors.imageTypeError'));
        return;
      }
      
      setFormData({ ...formData, image: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setFormData({ ...formData, image: null });
    setImagePreview(null);
    if (editingTopic) {
      setEditingTopic({ ...editingTopic, image: null });
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!editingTopic && !formData.name.uz.trim()) {
      toast.error(t('admin.topics.errors.nameRequired'));
      return;
    }
    
    if (editingTopic && !formData.name.uz.trim() && !formData.name['uz-Cyrl'].trim() && !formData.name.ru.trim()) {
      toast.error(t('admin.topics.errors.nameRequired'));
      return;
    }

    if (formData.order < 0) {
      toast.error(t('admin.topics.errors.invalidOrder'));
      return;
    }

    try {
      const submitData = new FormData();
      
      submitData.append('name.uz', formData.name.uz || '');
      submitData.append('name.uz-Cyrl', formData.name['uz-Cyrl'] || '');
      submitData.append('name.ru', formData.name.ru || '');
      
      submitData.append('description.uz', formData.description.uz || '');
      submitData.append('description.uz-Cyrl', formData.description['uz-Cyrl'] || '');
      submitData.append('description.ru', formData.description.ru || '');
      
      if (formData.order !== '' && formData.order !== null && formData.order !== undefined) {
        submitData.append('order', formData.order);
      }
      submitData.append('isActive', formData.isActive);
      
      if (formData.image) {
        submitData.append('image', formData.image);
      }

      if (editingTopic) {
        await api.put(`/admin/topics/${editingTopic._id}`, submitData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success(t('admin.topics.messages.updateSuccess'));
      } else {
        await api.post('/admin/topics', submitData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success(t('admin.topics.messages.createSuccess'));
      }
      setShowModal(false);
      setEditingTopic(null);
      setImagePreview(null);
      setFormData({
        name: { uz: '', 'uz-Cyrl': '', ru: '' },
        description: { uz: '', 'uz-Cyrl': '', ru: '' },
        order: '',
        isActive: true,
        image: null,
      });
      fetchTopics();
    } catch (error) {
      toast.error(t('admin.topics.errors.saveFailed'));
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.topicId) return;
    
    setDeleteModal({ ...deleteModal, loading: true });
    
    try {
      await api.delete(`/admin/topics/${deleteModal.topicId}`);
      toast.success(t('admin.topics.messages.deleteSuccess'));
      setDeleteModal({ isOpen: false, topicId: null, loading: false });
      fetchTopics();
    } catch (error) {
      if (error.response?.data?.message?.includes('questions')) {
        toast.error(t('admin.topics.errors.hasQuestions'));
      } else {
        toast.error(t('admin.topics.errors.deleteFailed'));
      }
      setDeleteModal({ ...deleteModal, loading: false });
    }
  };
  
  const openDeleteModal = (id) => {
    setDeleteModal({ isOpen: true, topicId: id, loading: false });
  };

  const handleToggleActive = async (id, currentStatus) => {
    try {
      await api.put(`/admin/topics/${id}`, { isActive: !currentStatus });
      toast.success(t(`admin.topics.messages.${!currentStatus ? 'activated' : 'deactivated'}`));
      fetchTopics();
    } catch (error) {
      toast.error(t('admin.topics.errors.statusChangeFailed'));
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('admin.topics.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t('admin.topics.total')}: {topics.length}
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="btn-primary flex items-center mt-4 sm:mt-0"
        >
          <FiPlus className="w-4 h-4 mr-2" />
          {t('admin.topics.addNew')}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {topics.map((topic, index) => (
          <motion.div
            key={topic._id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className="group"
          >
            <div className="card overflow-hidden hover:shadow-2xl transition-all duration-300 h-full flex flex-col">
              <div className="relative h-56 bg-gradient-to-br from-primary-500 to-primary-700 overflow-hidden">
                {topic.image ? (
                  <>
                    <img
                      src={sanitizeImageUrl(topic.image)}
                      alt={topic.name[i18n.language] || topic.name.uz}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      onError={handleImageError}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-400 to-primary-600 opacity-90" />
                    <FiBookOpen className="w-24 h-24 text-white/40 relative z-10 group-hover:scale-110 transition-transform duration-300" />
                  </div>
                )}
                
                <div className="absolute top-4 right-4">
                  <button
                    onClick={() => handleToggleActive(topic._id, topic.isActive)}
                    className={`p-2.5 rounded-xl backdrop-blur-md transition-all shadow-lg ${
                      topic.isActive
                        ? 'bg-green-500/90 text-white hover:bg-green-600 hover:scale-110'
                        : 'bg-gray-800/90 text-gray-300 hover:bg-gray-700 hover:scale-110'
                    }`}
                  >
                    {topic.isActive ? <FiEye className="w-5 h-5" /> : <FiEyeOff className="w-5 h-5" />}
                  </button>
                </div>

                <div className="absolute bottom-4 left-4">
                  <span className="px-4 py-2 bg-white/95 backdrop-blur-md text-gray-800 text-sm font-bold rounded-xl shadow-lg">
                    #{topic.order}
                  </span>
                </div>

                <div className="absolute bottom-4 right-4">
                  <div className="px-4 py-2 bg-black/70 backdrop-blur-md rounded-xl flex items-center space-x-2">
                    <FiBookOpen className="w-4 h-4 text-white/80" />
                    <span className="text-white font-bold">{topic.questionCount || 0}</span>
                  </div>
                </div>
              </div>

              <div className="p-6 flex-grow flex flex-col bg-gradient-to-b from-transparent to-gray-50/50 dark:to-gray-800/50">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 line-clamp-2">
                  {topic.name[i18n.language] || topic.name.uz}
                </h3>
                
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3 flex-grow">
                  {topic.description?.[i18n.language] || topic.description?.uz || t('admin.topics.noDescription')}
                </p>

                <div className="text-xs text-gray-500 dark:text-gray-500 mb-4">
                  {new Date(topic.createdAt).toLocaleDateString('uz-UZ', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>

                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleOpenModal(topic)}
                    className="flex-1 bg-primary-500 hover:bg-primary-600 text-white font-medium py-2.5 px-4 rounded-xl transition-all hover:shadow-lg hover:scale-105 flex items-center justify-center space-x-2"
                  >
                    <FiEdit className="w-4 h-4" />
                    <span>{t('common.edit')}</span>
                  </button>
                  <button
                    onClick={() => openDeleteModal(topic._id)}
                    className="p-2.5 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-600 rounded-xl transition-all hover:scale-105"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {showModal && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowModal(false);
              setEditingTopic(null);
              setImagePreview(null);
              setFormData({
                name: { uz: '', 'uz-Cyrl': '', ru: '' },
                description: { uz: '', 'uz-Cyrl': '', ru: '' },
                order: '',
                isActive: true,
                image: null,
              });
            }
          }}
        >
          <div className="flex min-h-full items-start justify-center p-4 sm:items-center">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white dark:bg-dark-card rounded-lg p-6 max-w-2xl w-full my-8 max-h-[calc(100vh-4rem)] overflow-y-auto relative shadow-2xl"
              style={{ scrollBehavior: 'smooth' }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setEditingTopic(null);
                  setImagePreview(null);
                  setFormData({
                    name: { uz: '', 'uz-Cyrl': '', ru: '' },
                    description: { uz: '', 'uz-Cyrl': '', ru: '' },
                    order: '',
                    isActive: true,
                    image: null,
                  });
                }}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>

              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 pr-10">
                {editingTopic ? t('admin.topics.editTitle') : t('admin.topics.createTitle')}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <label className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                    <FiUpload className="w-5 h-5 mr-2 text-purple-500" />
                    {t('admin.topics.image')}
                    <span className="text-xs text-gray-500 ml-2">{t('admin.topics.optional')}</span>
                  </label>
                  <div className="relative">
                    {imagePreview || editingTopic?.image ? (
                      <div className="relative group">
                        <img
                          src={imagePreview || sanitizeImageUrl(editingTopic.image)}
                          alt="Preview"
                          className="w-full h-56 object-cover rounded-xl border-2 border-gray-200 dark:border-gray-700 shadow-lg"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/placeholder-image.png';
                          }}
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                          <div className="flex gap-3">
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="p-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors shadow-lg"
                            >
                              <FiEdit className="w-5 h-5" />
                            </button>
                            <button
                              type="button"
                              onClick={removeImage}
                              className="p-3 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                            >
                              <FiTrash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-12 text-center cursor-pointer hover:border-purple-500 dark:hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-all duration-200 group"
                      >
                        <div className="mx-auto w-20 h-20 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                          <FiUpload className="w-10 h-10 text-white" />
                        </div>
                        <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                          {t('admin.topics.uploadTitle')}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {t('admin.topics.uploadDescription')}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          {t('admin.topics.uploadHint')}
                        </p>
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                    <FiBookOpen className="w-5 h-5 mr-2 text-blue-500" />
                    {t('admin.topics.name')}
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="space-y-3">
                    <div className="relative">
                      <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block flex items-center">
                        <span className="w-6 h-4 rounded bg-gradient-to-r from-blue-500 to-green-500 mr-2 flex items-center justify-center text-white text-xs font-bold">UZ</span>
                        O'zbek tili
                      </label>
                      <input
                        type="text"
                        placeholder={t('admin.topics.namePlaceholder.uz')}
                        value={formData.name.uz}
                        onChange={(e) =>
                          setFormData({ ...formData, name: { ...formData.name, uz: e.target.value } })
                        }
                        className="input focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pl-4"
                        required
                      />
                    </div>
                    <div className="relative">
                      <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block flex items-center">
                        <span className="w-6 h-4 rounded bg-gradient-to-r from-purple-500 to-pink-500 mr-2 flex items-center justify-center text-white text-xs font-bold">ЎЗ</span>
                        Ўзбек тили (Кирилл)
                      </label>
                      <input
                        type="text"
                        placeholder={t('admin.topics.namePlaceholder.uzCyrl')}
                        value={formData.name['uz-Cyrl']}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            name: { ...formData.name, 'uz-Cyrl': e.target.value },
                          })
                        }
                        className="input focus:ring-2 focus:ring-purple-500 focus:border-purple-500 pl-4"
                      />
                    </div>
                    <div className="relative">
                      <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block flex items-center">
                        <span className="w-6 h-4 rounded bg-gradient-to-r from-red-500 to-orange-500 mr-2 flex items-center justify-center text-white text-xs font-bold">RU</span>
                        Русский язык
                      </label>
                      <input
                        type="text"
                        placeholder={t('admin.topics.namePlaceholder.ru')}
                        value={formData.name.ru}
                        onChange={(e) =>
                          setFormData({ ...formData, name: { ...formData.name, ru: e.target.value } })
                        }
                        className="input focus:ring-2 focus:ring-red-500 focus:border-red-500 pl-4"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                    <FiEdit className="w-5 h-5 mr-2 text-green-500" />
                    {t('admin.topics.description')}
                    <span className="text-xs text-gray-500 ml-2">{t('admin.topics.optional')}</span>
                  </label>
                  <div className="space-y-3">
                    <div className="relative">
                      <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block flex items-center">
                        <span className="w-6 h-4 rounded bg-gradient-to-r from-blue-500 to-green-500 mr-2 flex items-center justify-center text-white text-xs font-bold">UZ</span>
                        O'zbek tili
                      </label>
                      <textarea
                        placeholder={t('admin.topics.descriptionPlaceholder.uz')}
                        value={formData.description.uz}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            description: { ...formData.description, uz: e.target.value },
                          })
                        }
                        className="input focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pl-4 resize-none"
                        rows="3"
                      />
                    </div>
                    <div className="relative">
                      <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block flex items-center">
                        <span className="w-6 h-4 rounded bg-gradient-to-r from-purple-500 to-pink-500 mr-2 flex items-center justify-center text-white text-xs font-bold">ЎЗ</span>
                        Ўзбек тили (Кирилл)
                      </label>
                      <textarea
                        placeholder={t('admin.topics.descriptionPlaceholder.uzCyrl')}
                        value={formData.description['uz-Cyrl']}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            description: { ...formData.description, 'uz-Cyrl': e.target.value },
                          })
                        }
                        className="input focus:ring-2 focus:ring-purple-500 focus:border-purple-500 pl-4 resize-none"
                        rows="3"
                      />
                    </div>
                    <div className="relative">
                      <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block flex items-center">
                        <span className="w-6 h-4 rounded bg-gradient-to-r from-red-500 to-orange-500 mr-2 flex items-center justify-center text-white text-xs font-bold">RU</span>
                        Русский язык
                      </label>
                      <textarea
                        placeholder={t('admin.topics.descriptionPlaceholder.ru')}
                        value={formData.description.ru}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            description: { ...formData.description, ru: e.target.value },
                          })
                        }
                        className="input focus:ring-2 focus:ring-red-500 focus:border-red-500 pl-4 resize-none"
                        rows="3"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                      <FiMove className="w-5 h-5 mr-2 text-yellow-500" />
                      {t('admin.topics.orderNumber')}
                    </label>
                    <input
                      type="number"
                      value={formData.order}
                      onChange={(e) => setFormData({ ...formData, order: e.target.value })}
                      className="input focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                      min="0"
                      placeholder={t('admin.topics.orderPlaceholder')}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {t('admin.topics.orderHelp')}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                      <FiEye className="w-5 h-5 mr-2 text-green-500" />
                      {t('admin.topics.status')}
                    </label>
                    <label className="flex items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        className="w-5 h-5 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 dark:focus:ring-green-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 mr-3"
                      />
                      <div className="flex items-center">
                        {formData.isActive ? (
                          <FiEye className="w-5 h-5 text-green-600 mr-2" />
                        ) : (
                          <FiEyeOff className="w-5 h-5 text-gray-400 mr-2" />
                        )}
                        <span className={`font-medium ${formData.isActive ? 'text-green-700 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                          {formData.isActive 
                            ? t('admin.topics.activeStatus')
                            : t('admin.topics.inactiveStatus')
                          }
                        </span>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingTopic(null);
                      setImagePreview(null);
                      setFormData({
                        name: { uz: '', 'uz-Cyrl': '', ru: '' },
                        description: { uz: '', 'uz-Cyrl': '', ru: '' },
                        order: '',
                        isActive: true,
                        image: null,
                      });
                    }}
                    className="flex-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500 font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                  >
                    <FiX className="w-4 h-4" />
                    {t('common.cancel')}
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    {editingTopic ? (
                      <>
                        <FiEdit className="w-4 h-4" />
                        {t('common.update')}
                      </>
                    ) : (
                      <>
                        <FiPlus className="w-4 h-4" />
                        {t('common.add')}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, topicId: null, loading: false })}
        onConfirm={handleDelete}
        title={t('admin.topics.confirm.delete')}
        description={t('admin.topics.confirm.deleteDescription')}
        loading={deleteModal.loading}
      />
    </div>
  );
};

export default TopicsPage;
