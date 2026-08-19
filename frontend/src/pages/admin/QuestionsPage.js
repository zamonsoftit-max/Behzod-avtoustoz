import React, { useState, useEffect, useCallback } from 'react';
import DeleteModal from '../../components/shared/DeleteModal';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { debounce } from 'lodash';
import {
  FiSearch,
  FiPlus,
  FiEdit,
  FiTrash2,
  FiImage,
  FiEye,
  FiEyeOff,
  FiPlusCircle,
  FiMinusCircle,
} from 'react-icons/fi';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Pagination from '../../components/common/Pagination';
import toast from 'react-hot-toast';

const QuestionsPage = () => {
  const { t, i18n } = useTranslation();
  const [questions, setQuestions] = useState([]);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, questionId: null, loading: false });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [showModal, setShowModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [formData, setFormData] = useState({
    text: { uz: '', 'uz-Cyrl': '', ru: '' },
    options: [
      { text: { uz: '', 'uz-Cyrl': '', ru: '' }, isCorrect: false },
      { text: { uz: '', 'uz-Cyrl': '', ru: '' }, isCorrect: false },
    ],
    topic: '',
    difficulty: 'medium',
    explanation: { uz: '', 'uz-Cyrl': '', ru: '' },
    isActive: true,
  });
  const [imageFile, setImageFile] = useState(null);

  // Debounced search function
  // lodash debounce returns a wrapped function whose dependencies cannot be inferred.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = useCallback(
    debounce((value) => {
      setSearchTerm(value);
      setPagination(prev => ({ ...prev, page: 1 }));
    }, 500),
    []
  );

  useEffect(() => {
    fetchTopics();
    fetchQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, searchTerm, selectedTopic, selectedDifficulty]);

  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchInput(value);
    debouncedSearch(value);
  };

  const fetchTopics = async () => {
    try {
      const response = await api.get('/admin/topics');
      setTopics(response.data.data);
    } catch (error) {
      // Error is handled by toast notification
    }
  };

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
      });

      if (searchTerm) params.append('search', searchTerm);
      if (selectedTopic) params.append('topic', selectedTopic);
      if (selectedDifficulty) params.append('difficulty', selectedDifficulty);

      const response = await api.get(`/admin/questions?${params}`);
      setQuestions(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      // Error is handled by toast notification
      toast.error(t('admin.questions.errors.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (question = null) => {
    if (question) {
      setEditingQuestion(question);
      setFormData({
        text: question.question || question.text,
        options: question.options,
        topic: question.topic?._id || question.topic,
        difficulty: question.difficulty || 'medium',
        explanation: question.explanation || { uz: '', 'uz-Cyrl': '', ru: '' },
        isActive: question.isActive !== undefined ? question.isActive : true,
      });
    } else {
      setEditingQuestion(null);
      setFormData({
        text: { uz: '', 'uz-Cyrl': '', ru: '' },
        options: [
          { text: { uz: '', 'uz-Cyrl': '', ru: '' }, isCorrect: false },
          { text: { uz: '', 'uz-Cyrl': '', ru: '' }, isCorrect: false },
        ],
        topic: '',
        difficulty: 'medium',
        explanation: { uz: '', 'uz-Cyrl': '', ru: '' },
        isActive: true,
      });
    }
    setImageFile(null);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.text.uz.trim()) {
      toast.error(t('admin.questions.errors.validationErrors.questionRequired'));
      return;
    }

    if (!formData.topic) {
      toast.error(t('admin.questions.errors.validationErrors.topicRequired'));
      return;
    }

    // Check if we have at least 2 options
    if (formData.options.length < 2) {
      toast.error(t('admin.questions.errors.validationErrors.minOptions'));
      return;
    }

    // Check if at least one correct answer is selected
    const hasCorrectAnswer = formData.options.some(opt => opt.isCorrect);
    if (!hasCorrectAnswer) {
      toast.error(t('admin.questions.errors.validationErrors.correctAnswerRequired'));
      return;
    }

    // Check if all options have text in at least Uzbek
    const hasEmptyOptions = formData.options.some(opt => !opt.text.uz.trim());
    if (hasEmptyOptions) {
      toast.error(t('admin.questions.errors.validationErrors.optionsRequired'));
      return;
    }

    // Check image file size if present
    if (imageFile && imageFile.size > 5 * 1024 * 1024) {
      toast.error(t('admin.questions.errors.validationErrors.imageSizeError'));
      return;
    }

    try {
      if (imageFile) {
        // If there's an image, use FormData
        const formDataToSend = new FormData();
        formDataToSend.append('question', JSON.stringify(formData.text));
        formDataToSend.append('options', JSON.stringify(formData.options));
        formDataToSend.append('correctAnswer', formData.options.findIndex(opt => opt.isCorrect));
        formDataToSend.append('topic', formData.topic);
        formDataToSend.append('difficulty', formData.difficulty);
        formDataToSend.append('explanation', JSON.stringify(formData.explanation));
        formDataToSend.append('isActive', formData.isActive);
        formDataToSend.append('image', imageFile);

        if (editingQuestion) {
          await api.put(`/admin/questions/${editingQuestion._id}`, formDataToSend);
        } else {
          await api.post('/admin/questions', formDataToSend);
        }
      } else {
        // If no image, send JSON
        const dataToSend = {
          question: formData.text,
          options: formData.options,
          correctAnswer: formData.options.findIndex(opt => opt.isCorrect),
          topic: formData.topic,
          difficulty: formData.difficulty,
          explanation: formData.explanation,
          isActive: formData.isActive
        };

        if (editingQuestion) {
          await api.put(`/admin/questions/${editingQuestion._id}`, dataToSend);
        } else {
          await api.post('/admin/questions', dataToSend);
        }
      }

      toast.success(editingQuestion ? t('admin.questions.messages.updated') : t('admin.questions.messages.added'));
      setShowModal(false);
      fetchQuestions();
    } catch (error) {
      // Error is handled by toast notification
      toast.error(t('admin.questions.errors.saveError'));
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.questionId) return;
    
    setDeleteModal({ ...deleteModal, loading: true });
    
    try {
      await api.delete(`/admin/questions/${deleteModal.questionId}`);
      toast.success(t('admin.questions.messages.deleted'));
      setDeleteModal({ isOpen: false, questionId: null, loading: false });
      fetchQuestions();
    } catch (error) {
      // Error is handled by toast notification
      toast.error(t('admin.questions.errors.deleteError'));
      setDeleteModal({ ...deleteModal, loading: false });
    }
  };
  
  const openDeleteModal = (id) => {
    setDeleteModal({ isOpen: true, questionId: id, loading: false });
  };

  const handleToggleActive = async (id, currentStatus) => {
    try {
      await api.put(`/admin/questions/${id}`, { isActive: !currentStatus });
      toast.success(t('admin.questions.messages.statusChanged') + ' - ' + t(`admin.questions.status.${!currentStatus ? 'activated' : 'deactivated'}`));
      fetchQuestions();
    } catch (error) {
      // Error is handled by toast notification
      toast.error(t('admin.questions.errors.statusError'));
    }
  };

  const handleOptionChange = (index, field, value) => {
    const newOptions = [...formData.options];
    if (field === 'isCorrect') {
      // Only one correct answer allowed
      newOptions.forEach((opt, i) => {
        opt.isCorrect = i === index ? value : false;
      });
    } else {
      newOptions[index].text[field] = value;
    }
    setFormData({ ...formData, options: newOptions });
  };

  const handleAddOption = () => {
    if (formData.options.length < 5) {
      setFormData({
        ...formData,
        options: [
          ...formData.options,
          { text: { uz: '', 'uz-Cyrl': '', ru: '' }, isCorrect: false }
        ]
      });
    }
  };

  const handleRemoveOption = (index) => {
    if (formData.options.length > 2) {
      const newOptions = formData.options.filter((_, i) => i !== index);
      // If removed option was the correct one, clear all correct selections
      if (formData.options[index].isCorrect) {
        newOptions.forEach(opt => opt.isCorrect = false);
      }
      setFormData({ ...formData, options: newOptions });
    }
  };

  if (loading && questions.length === 0) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('admin.questions.title')}
          </h1>
          <div className="mt-1">
            <p className="text-gray-600 dark:text-gray-400">
              {t('admin.questions.statistics.total', { total: pagination.total })}
            </p>
            {(searchTerm || selectedTopic || selectedDifficulty) && (
              <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                {t('admin.questions.statistics.filtered', { count: questions.length })}
              </p>
            )}
          </div>
        </div>
        <button onClick={() => handleOpenModal()} className="btn-primary flex items-center mt-4 sm:mt-0">
          <FiPlus className="w-4 h-4 mr-2" />
          {t('admin.questions.add_question')}
        </button>
      </div>

      {/* Active filters display */}
      {(searchTerm || selectedTopic || selectedDifficulty) && (
        <div className="flex flex-wrap gap-2 mb-4">
          {searchTerm && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
              {t('admin.questions.filters.search')}: {searchTerm}
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSearchInput('');
                }}
                className="ml-2 hover:text-blue-900 dark:hover:text-blue-300"
              >
                ×
              </button>
            </span>
          )}
          {selectedTopic && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
              {t('admin.questions.filters.topic')}: {topics.find(t => t._id === selectedTopic)?.name[i18n.language] || topics.find(t => t._id === selectedTopic)?.name.uz}
              <button
                onClick={() => setSelectedTopic('')}
                className="ml-2 hover:text-green-900 dark:hover:text-green-300"
              >
                ×
              </button>
            </span>
          )}
          {selectedDifficulty && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400">
              {t('admin.questions.filters.level')}: {t(`admin.questions.filters.${selectedDifficulty}`)}
              <button
                onClick={() => setSelectedDifficulty('')}
                className="ml-2 hover:text-orange-900 dark:hover:text-orange-300"
              >
                ×
              </button>
            </span>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={t('admin.questions.search_placeholder')}
              value={searchInput}
              onChange={handleSearchChange}
              className="input pl-10"
            />
          </div>

          <select
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            className="input"
          >
            <option value="">{t('admin.questions.filters.all_topics')}</option>
            {topics.map((topic) => (
              <option key={topic._id} value={topic._id}>
                {topic.name[i18n.language] || topic.name.uz}
              </option>
            ))}
          </select>

          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="input"
          >
            <option value="">{t('admin.questions.filters.all_levels')}</option>
            <option value="easy">{t('admin.questions.filters.easy')}</option>
            <option value="medium">{t('admin.questions.filters.medium')}</option>
            <option value="hard">{t('admin.questions.filters.hard')}</option>
          </select>

          <button
            onClick={() => {
              setSearchTerm('');
              setSearchInput('');
              setSelectedTopic('');
              setSelectedDifficulty('');
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            className="btn-secondary"
          >
            {t('admin.questions.filters.clear')}
          </button>
        </div>
      </div>

      {/* Questions list */}
      <div className="card">
        {loading && (
          <div className="absolute inset-0 bg-white/50 dark:bg-dark-card/50 flex items-center justify-center z-10 rounded-lg">
            <LoadingSpinner />
          </div>
        )}
        <div className="overflow-x-auto relative">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('admin.questions.table.question')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('admin.questions.table.topic')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('admin.questions.table.level')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('admin.questions.table.status')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('admin.questions.table.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-dark-card divide-y divide-gray-200 dark:divide-gray-700">
              {questions.map((question, index) => (
                <motion.tr
                  key={question._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <td className="px-6 py-4">
                    <div className="max-w-xs">
                      <p className="text-sm text-gray-900 dark:text-white truncate">
                        {question.question?.[i18n.language] || question.question?.uz || question.text?.[i18n.language] || question.text?.uz || ''}
                      </p>
                      {question.image && (
                        <div className="flex items-center mt-1 text-xs text-gray-500">
                          <FiImage className="w-3 h-3 mr-1" />
                          {t('admin.questions.table.image_available')}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900 dark:text-white">
                      {question.topic?.name[i18n.language] || question.topic?.name.uz}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        question.difficulty === 'easy'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : question.difficulty === 'medium'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                      }`}
                    >
                      {t(`admin.questions.filters.${question.difficulty}`)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleActive(question._id, question.isActive)}
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        question.isActive
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                      }`}
                    >
                      {question.isActive ? (
                        <>
                          <FiEye className="w-3 h-3 mr-1" />
                          {t('admin.questions.status.active')}
                        </>
                      ) : (
                        <>
                          <FiEyeOff className="w-3 h-3 mr-1" />
                          {t('admin.questions.status.inactive')}
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleOpenModal(question)}
                        className="p-1.5 rounded-lg text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                        title={t('admin.questions.table.edit') || "Tahrirlash"}
                      >
                        <FiEdit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openDeleteModal(question._id)}
                        className="p-1.5 rounded-lg text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-900/30 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                        title={t('admin.questions.table.delete') || "O'chirish"}
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.pages}
              onPageChange={(page) => setPagination({ ...pagination, page })}
            />
          </div>
        )}
      </div>

      {/* Question modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto">
          <div className="flex min-h-full items-start justify-center p-4 sm:items-center">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white dark:bg-dark-card rounded-lg p-6 max-w-4xl w-full my-8 max-h-[calc(100vh-4rem)] overflow-y-auto relative shadow-2xl"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {editingQuestion ? t('admin.questions.form.edit_title') : t('admin.questions.form.add_title')}
              </h3>
            
              <form onSubmit={handleSubmit} className="space-y-6">
              {/* Question text */}
              <div>
                <label className="label">{t('admin.questions.form.question_text')}</label>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder={t('admin.questions.form.placeholders.uz')}
                    value={formData.text.uz}
                    onChange={(e) => setFormData({ ...formData, text: { ...formData.text, uz: e.target.value } })}
                    className="input"
                    required
                  />
                  <input
                    type="text"
                    placeholder={t('admin.questions.form.placeholders.uz_cyrl')}
                    value={formData.text['uz-Cyrl']}
                    onChange={(e) => setFormData({ ...formData, text: { ...formData.text, 'uz-Cyrl': e.target.value } })}
                    className="input"
                  />
                  <input
                    type="text"
                    placeholder={t('admin.questions.form.placeholders.ru')}
                    value={formData.text.ru}
                    onChange={(e) => setFormData({ ...formData, text: { ...formData.text, ru: e.target.value } })}
                    className="input"
                  />
                </div>
              </div>

              {/* Options */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="label mb-0">{t('admin.questions.form.options')}</label>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {t('admin.questions.form.options_count', { count: formData.options.length })}
                    </span>
                    {formData.options.length < 5 && (
                      <button
                        type="button"
                        onClick={handleAddOption}
                        className="inline-flex items-center px-3 py-2 text-sm font-medium text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/20 border border-green-300 dark:border-green-700 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/30 transition-colors"
                        title={t('admin.questions.form.add_option')}
                      >
                        <FiPlusCircle className="w-4 h-4 mr-2" />
                        {t('admin.questions.form.add_option', 'Variant qo\'shish')}
                      </button>
                    )}
                  </div>
                </div>
                <div className="space-y-4">
                  {formData.options.map((option, index) => (
                    <div key={index} className={`p-4 rounded-lg relative border transition-colors ${
                      option.isCorrect 
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700' 
                        : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <label 
                          className="flex items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded p-2 -m-2 transition-colors"
                          onClick={() => handleOptionChange(index, 'isCorrect', true)}
                        >
                          <input
                            type="radio"
                            name="correctAnswer"
                            checked={option.isCorrect}
                            onChange={(e) => handleOptionChange(index, 'isCorrect', e.target.checked)}
                            className="mr-3 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                          />
                          <span className="text-sm font-medium text-gray-900 dark:text-white select-none">
                            <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-xs font-bold mr-2">
                              {String.fromCharCode(65 + index)}
                            </span>
                            {t('admin.questions.form.option_label', 'Variant')}
                            {option.isCorrect && (
                              <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                                {t('admin.questions.form.option_correct', 'To\'g\'ri javob')}
                              </span>
                            )}
                          </span>
                        </label>
                        {formData.options.length > 2 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveOption(index)}
                            className="p-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                            title={t('admin.questions.form.remove_option')}
                          >
                            <FiMinusCircle className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                      <div className="space-y-2">
                        <input
                          type="text"
                          placeholder={t('admin.questions.form.placeholders.uz')}
                          value={option.text.uz}
                          onChange={(e) => handleOptionChange(index, 'uz', e.target.value)}
                          className={`input text-sm ${option.isCorrect ? 'ring-2 ring-green-500 dark:ring-green-400 border-green-300 dark:border-green-600' : ''}`}
                          required
                        />
                        <input
                          type="text"
                          placeholder={t('admin.questions.form.placeholders.uz_cyrl')}
                          value={option.text['uz-Cyrl']}
                          onChange={(e) => handleOptionChange(index, 'uz-Cyrl', e.target.value)}
                          className={`input text-sm ${option.isCorrect ? 'ring-2 ring-green-500 dark:ring-green-400 border-green-300 dark:border-green-600' : ''}`}
                        />
                        <input
                          type="text"
                          placeholder={t('admin.questions.form.placeholders.ru')}
                          value={option.text.ru}
                          onChange={(e) => handleOptionChange(index, 'ru', e.target.value)}
                          className={`input text-sm ${option.isCorrect ? 'ring-2 ring-green-500 dark:ring-green-400 border-green-300 dark:border-green-600' : ''}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Topic and difficulty */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">{t('admin.questions.form.topic')}</label>
                  <select
                    value={formData.topic}
                    onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                    className="input"
                    required
                  >
                    <option value="">{t('admin.questions.form.select_topic')}</option>
                    {topics.map((topic) => (
                      <option key={topic._id} value={topic._id}>
                        {topic.name[i18n.language] || topic.name.uz}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">{t('admin.questions.form.difficulty')}</label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                    className="input"
                  >
                    <option value="easy">{t('admin.questions.filters.easy')}</option>
                    <option value="medium">{t('admin.questions.filters.medium')}</option>
                    <option value="hard">{t('admin.questions.filters.hard')}</option>
                  </select>
                </div>
              </div>

              {/* Image upload */}
              <div>
                <label className="label">{t('admin.questions.form.image')}</label>
                <div className="mt-2">
                  <label className="flex items-center justify-center w-full h-32 px-4 transition bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg appearance-none cursor-pointer hover:border-primary-500 focus:outline-none">
                    <div className="flex flex-col items-center space-y-2">
                      <FiImage className="w-8 h-8 text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {imageFile ? imageFile.name : t('admin.questions.form.uploadImage')}
                      </span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setImageFile(e.target.files[0])}
                      className="hidden"
                    />
                  </label>
                </div>
                {editingQuestion?.image && !imageFile && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {t('admin.questions.form.current_image_note')}
                  </p>
                )}
              </div>

              {/* Explanation */}
              <div>
                <label className="label">{t('admin.questions.form.explanation')}</label>
                <div className="space-y-2">
                  <textarea
                    placeholder={t('admin.questions.form.placeholders.uz')}
                    value={formData.explanation.uz}
                    onChange={(e) => setFormData({ ...formData, explanation: { ...formData.explanation, uz: e.target.value } })}
                    className="input"
                    rows="3"
                  />
                  <textarea
                    placeholder={t('admin.questions.form.placeholders.uz_cyrl')}
                    value={formData.explanation['uz-Cyrl']}
                    onChange={(e) => setFormData({ ...formData, explanation: { ...formData.explanation, 'uz-Cyrl': e.target.value } })}
                    className="input"
                    rows="3"
                  />
                  <textarea
                    placeholder={t('admin.questions.form.placeholders.ru')}
                    value={formData.explanation.ru}
                    onChange={(e) => setFormData({ ...formData, explanation: { ...formData.explanation, ru: e.target.value } })}
                    className="input"
                    rows="3"
                  />
                </div>
              </div>

              {/* Form actions */}
              <div className="flex space-x-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 btn-secondary">
                  {t('admin.questions.form.cancel')}
                </button>
                <button type="submit" className="flex-1 btn-primary">
                  {editingQuestion ? t('admin.questions.form.update') : t('admin.questions.form.save')}
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
        onClose={() => setDeleteModal({ isOpen: false, questionId: null, loading: false })}
        onConfirm={handleDelete}
        title={t('admin.questions.confirm.deleteTitle')}
        description={t('admin.questions.confirm.deleteDescription')}
        loading={deleteModal.loading}
      />
    </div>
  );
};

export default QuestionsPage;
