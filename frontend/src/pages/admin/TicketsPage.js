import React, { useState, useEffect } from 'react';
import DeleteModal from '../../components/shared/DeleteModal';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  FiFileText,
  FiPlus,
  FiEdit,
  FiTrash2,
  FiRefreshCw,
  FiEye,
  FiEyeOff,
  FiSearch,
  FiFilter,
} from 'react-icons/fi';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const TicketsPage = () => {
  const { t, i18n } = useTranslation();
  const [tickets, setTickets] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [editingTicket, setEditingTicket] = useState(null);
  const [formData, setFormData] = useState({
    number: 1,
    questions: [],
    difficulty: 'mixed',
    isActive: true,
  });
  const [generateForm, setGenerateForm] = useState({
    count: 100,
    questionsPerTicket: 10,
  });
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalSearchTerm, setModalSearchTerm] = useState('');
  const [modalTopicFilter, setModalTopicFilter] = useState('');
  const [modalDifficultyFilter, setModalDifficultyFilter] = useState('');
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, ticketId: null, loading: false });

  // Fetch helpers are component-local and intentionally run on initial load.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchTickets();
    fetchQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchTickets();
    }, searchTerm.trim() ? 500 : 0);

    return () => clearTimeout(delayDebounceFn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, difficultyFilter, statusFilter]);

  // Filter tickets locally if backend filtering is not available
  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = !searchTerm.trim() || 
      ticket.number.toString().includes(searchTerm.trim());
    
    const matchesDifficulty = !difficultyFilter || 
      ticket.difficulty === difficultyFilter;
    
    const matchesStatus = !statusFilter || 
      (statusFilter === 'active' ? ticket.isActive : !ticket.isActive);
    
    return matchesSearch && matchesDifficulty && matchesStatus;
  });

  // Filter questions in modal
  const filteredQuestions = questions.filter(question => {
    const questionText = question.question?.[i18n.language] || question.question?.uz || question.text?.[i18n.language] || question.text?.uz || '';
    const topicName = question.topic?.name?.[i18n.language] || question.topic?.name?.uz || '';
    
    const matchesSearch = !modalSearchTerm.trim() || 
      questionText.toLowerCase().includes(modalSearchTerm.trim().toLowerCase()) ||
      topicName.toLowerCase().includes(modalSearchTerm.trim().toLowerCase());
    
    const matchesTopic = !modalTopicFilter || 
      question.topic?._id === modalTopicFilter;
    
    const matchesDifficulty = !modalDifficultyFilter || 
      question.difficulty === modalDifficultyFilter;
    
    return matchesSearch && matchesTopic && matchesDifficulty;
  });

  // Get unique topics for filter dropdown
  const uniqueTopics = questions.reduce((acc, question) => {
    if (question.topic && !acc.find(t => t._id === question.topic._id)) {
      acc.push(question.topic);
    }
    return acc;
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: '200'
      });

      if (searchTerm.trim()) params.append('search', searchTerm.trim());
      if (difficultyFilter) params.append('difficulty', difficultyFilter);
      if (statusFilter) {
        params.append('isActive', statusFilter === 'active' ? 'true' : 'false');
      }

      const response = await api.get(`/admin/tickets?${params}`);
      setTickets(response.data.data || []);
    } catch (error) {
      console.error('Fetch tickets error:', error);
      toast.error(t('admin.tickets.errors.loadError'));
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestions = async () => {
    try {
      const response = await api.get('/admin/questions?limit=500');
      setQuestions(response.data.data);
    } catch (error) {
      // Error is handled by toast notification
    }
  };

  const handleOpenModal = (ticket = null) => {
    if (ticket) {
      setEditingTicket(ticket);
      setFormData({
        number: ticket.number,
        questions: ticket.questions.map(q => q._id),
        difficulty: ticket.difficulty,
        isActive: ticket.isActive,
      });
      setSelectedQuestions(ticket.questions.map(q => q._id));
    } else {
      // Find the highest ticket number to avoid duplicates
      const existingNumbers = tickets.map(t => t.number).filter(n => !isNaN(n));
      const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
      setEditingTicket(null);
      setFormData({
        number: nextNumber,
        questions: [],
        difficulty: 'mixed',
        isActive: true,
      });
      setSelectedQuestions([]);
    }
    // Reset modal filters
    setModalSearchTerm('');
    setModalTopicFilter('');
    setModalDifficultyFilter('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (selectedQuestions.length === 0) {
      toast.error(t('admin.tickets.messages.selectQuestions'));
      return;
    }

    try {
      const data = {
        ...formData,
        questions: selectedQuestions,
      };

      if (editingTicket) {
        await api.put(`/admin/tickets/${editingTicket._id}`, data);
        toast.success(t('admin.tickets.messages.updated'));
      } else {
        await api.post('/admin/tickets', data);
        toast.success(t('admin.tickets.messages.added'));
      }
      setShowModal(false);
      fetchTickets();
    } catch (error) {
      // Error is handled by toast notification
      toast.error(t('admin.tickets.errors.saveError'));
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.ticketId) return;
    
    setDeleteModal({ ...deleteModal, loading: true });
    
    try {
      await api.delete(`/admin/tickets/${deleteModal.ticketId}`);
      toast.success(t('admin.tickets.messages.deleted'));
      setDeleteModal({ isOpen: false, ticketId: null, loading: false });
      fetchTickets();
    } catch (error) {
      // Error is handled by toast notification
      toast.error(t('admin.tickets.errors.deleteError'));
      setDeleteModal({ ...deleteModal, loading: false });
    }
  };
  
  const openDeleteModal = (id) => {
    setDeleteModal({ isOpen: true, ticketId: id, loading: false });
  };

  const handleToggleActive = async (id, currentStatus) => {
    try {
      await api.put(`/admin/tickets/${id}`, { isActive: !currentStatus });
      toast.success(t('admin.tickets.messages.statusChanged'));
      fetchTickets();
    } catch (error) {
      // Error is handled by toast notification
      toast.error(t('admin.tickets.errors.statusError'));
    }
  };

  const handleGenerateTickets = async (e) => {
    e.preventDefault();

    if (!window.confirm(t('admin.tickets.confirm.generate'))) {
      return;
    }

    try {
      setLoading(true);
      await api.post('/admin/tickets/generate', generateForm);
      toast.success(t('admin.tickets.messages.generated'));
      setShowGenerateModal(false);
      fetchTickets();
    } catch (error) {
      // Error is handled by toast notification
      toast.error(t('admin.tickets.errors.generateError'));
    } finally {
      setLoading(false);
    }
  };

  const toggleQuestionSelection = (questionId) => {
    if (selectedQuestions.includes(questionId)) {
      setSelectedQuestions(selectedQuestions.filter(id => id !== questionId));
    } else {
      setSelectedQuestions([...selectedQuestions, questionId]);
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
            {t('admin.tickets.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t('common.total')}: {filteredTickets.length} / {tickets.length} • {filteredTickets.filter(t => t.isActive).length} faol
          </p>
        </div>
        <div className="flex space-x-3 mt-4 sm:mt-0">
          <button
            onClick={() => setShowGenerateModal(true)}
            className="btn-secondary flex items-center"
          >
            <FiRefreshCw className="w-4 h-4 mr-2" />
            {t('admin.tickets.generate_tickets')}
          </button>
          <button
            onClick={() => handleOpenModal()}
            className="btn-primary flex items-center"
          >
            <FiPlus className="w-4 h-4 mr-2" />
            {t('admin.tickets.add_ticket')}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={t('admin.tickets.search.placeholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>

          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            className="input"
          >
            <option value="">{t('admin.tickets.filters.allDifficulties')}</option>
            <option value="easy">{t('admin.tickets.difficulty.easy')}</option>
            <option value="medium">{t('admin.tickets.difficulty.medium')}</option>
            <option value="hard">{t('admin.tickets.difficulty.hard')}</option>
            <option value="mixed">{t('admin.tickets.difficulty.mixed')}</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input"
          >
            <option value="">{t('admin.tickets.filters.allStatuses')}</option>
            <option value="active">{t('admin.tickets.status.active')}</option>
            <option value="inactive">{t('admin.tickets.status.inactive')}</option>
          </select>

          <button
            onClick={() => {
              setSearchTerm('');
              setDifficultyFilter('');
              setStatusFilter('');
            }}
            className="btn-secondary flex items-center justify-center"
          >
            <FiFilter className="w-4 h-4 mr-2" />
            {t('admin.tickets.filters.clear')}
          </button>
        </div>
      </div>

      {/* Tickets table */}
      {filteredTickets.length === 0 ? (
        <div className="card p-8 text-center">
          <FiFileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {tickets.length === 0 ? t('admin.tickets.noTickets') : t('admin.tickets.noSearchResults')}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {t('admin.tickets.noTicketsDescription')}
          </p>
          <div className="flex justify-center space-x-3">
            <button
              onClick={() => handleOpenModal()}
              className="btn-primary flex items-center"
            >
              <FiPlus className="w-4 h-4 mr-2" />
              {t('admin.tickets.add_ticket')}
            </button>
            <button
              onClick={() => setShowGenerateModal(true)}
              className="btn-secondary flex items-center"
            >
              <FiRefreshCw className="w-4 h-4 mr-2" />
              {t('admin.tickets.generate_tickets')}
            </button>
          </div>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('admin.tickets.table.number')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('admin.tickets.table.questions')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('admin.tickets.table.difficulty')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('admin.tickets.table.status')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('admin.tickets.table.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredTickets.map((ticket, index) => (
                  <motion.tr
                    key={ticket._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FiFileText className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {ticket.number}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900 dark:text-white">
                        {ticket.questions.length} {t('admin.tickets.table.questionsCount')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        ticket.difficulty === 'easy' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          : ticket.difficulty === 'medium'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                          : ticket.difficulty === 'hard'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                          : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                      }`}>
                        {ticket.difficulty === 'easy' ? t('admin.tickets.difficulty.easy') : 
                         ticket.difficulty === 'medium' ? t('admin.tickets.difficulty.medium') : 
                         ticket.difficulty === 'hard' ? t('admin.tickets.difficulty.hard') : 
                         t('admin.tickets.difficulty.mixed')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        ticket.isActive
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {ticket.isActive ? t('admin.tickets.status.active') : t('admin.tickets.status.inactive')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleToggleActive(ticket._id, ticket.isActive)}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          title={ticket.isActive ? t('admin.tickets.actions.deactivate') : t('admin.tickets.actions.activate')}
                        >
                          {ticket.isActive ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleOpenModal(ticket)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          title={t('common.edit')}
                        >
                          <FiEdit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(ticket._id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          title={t('common.delete')}
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
        </div>
      )}

      {/* Ticket modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-dark-card rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {editingTicket ? t('admin.tickets.form.editTitle') : t('admin.tickets.add_ticket')}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Ticket number */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">{t('admin.tickets.form.number')}</label>
                  <input
                    type="number"
                    value={formData.number}
                    onChange={(e) => setFormData({ ...formData, number: parseInt(e.target.value) })}
                    className="input"
                    min="1"
                    required
                  />
                </div>
                <div>
                  <label className="label">{t('admin.tickets.form.difficulty')}</label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                    className="input"
                  >
                    <option value="easy">{t('admin.tickets.difficulty.easy')}</option>
                    <option value="medium">{t('admin.tickets.difficulty.medium')}</option>
                    <option value="hard">{t('admin.tickets.difficulty.hard')}</option>
                    <option value="mixed">{t('admin.tickets.difficulty.mixed')}</option>
                  </select>
                </div>
              </div>

              {/* Questions selection */}
              <div>
                <label className="label">
                  {t('admin.tickets.form.questions')} ({selectedQuestions.length} {t('common.selectedLowercase')})
                </label>
                
                {/* Question filters */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                  <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder={t('admin.tickets.modal.searchQuestions')}
                      value={modalSearchTerm}
                      onChange={(e) => setModalSearchTerm(e.target.value)}
                      className="input pl-10"
                    />
                  </div>
                  
                  <select
                    value={modalTopicFilter}
                    onChange={(e) => setModalTopicFilter(e.target.value)}
                    className="input"
                  >
                    <option value="">{t('admin.tickets.modal.allTopics')}</option>
                    {uniqueTopics.map((topic) => (
                      <option key={topic._id} value={topic._id}>
                        {topic.name?.[i18n.language] || topic.name?.uz}
                      </option>
                    ))}
                  </select>
                  
                  <select
                    value={modalDifficultyFilter}
                    onChange={(e) => setModalDifficultyFilter(e.target.value)}
                    className="input"
                  >
                    <option value="">{t('admin.tickets.modal.allDifficulties')}</option>
                    <option value="easy">{t('admin.tickets.difficulty.easy')}</option>
                    <option value="medium">{t('admin.tickets.difficulty.medium')}</option>
                    <option value="hard">{t('admin.tickets.difficulty.hard')}</option>
                  </select>
                </div>
                
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg max-h-96 overflow-y-auto p-4">
                  {filteredQuestions.length > 0 ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {t('admin.tickets.modal.showingQuestions', { 
                            count: filteredQuestions.length, 
                            total: questions.length 
                          })}
                        </span>
                        <div className="flex space-x-2">
                          <button
                            type="button"
                            onClick={() => {
                              const newSelected = [...selectedQuestions];
                              filteredQuestions.forEach(q => {
                                if (!newSelected.includes(q._id)) {
                                  newSelected.push(q._id);
                                }
                              });
                              setSelectedQuestions(newSelected);
                            }}
                            className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                          >
                            {t('admin.tickets.modal.selectAll')}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const filteredIds = filteredQuestions.map(q => q._id);
                              setSelectedQuestions(selectedQuestions.filter(id => !filteredIds.includes(id)));
                            }}
                            className="text-xs px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                          >
                            {t('admin.tickets.modal.deselectAll')}
                          </button>
                        </div>
                      </div>
                      {filteredQuestions.map((question) => (
                        <label
                          key={question._id}
                          className="flex items-start p-3 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={selectedQuestions.includes(question._id)}
                            onChange={() => toggleQuestionSelection(question._id)}
                            className="mt-1 mr-3 w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                          />
                          <div className="flex-1">
                            <p className="text-sm text-gray-900 dark:text-white">
                              {question.question?.[i18n.language] || question.question?.uz || question.text?.[i18n.language] || question.text?.uz}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              {question.topic?.name[i18n.language] || question.topic?.name.uz} • {' '}
                              {question.difficulty === 'easy' ? t('admin.tickets.difficulty.easy') : 
                               question.difficulty === 'medium' ? t('admin.tickets.difficulty.medium') : t('admin.tickets.difficulty.hard')}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-600 dark:text-gray-400 mb-2">
                        {questions.length === 0 
                          ? t('admin.questions.noQuestions')
                          : t('admin.tickets.modal.noQuestionsFiltered')
                        }
                      </p>
                      {questions.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setModalSearchTerm('');
                            setModalTopicFilter('');
                            setModalDifficultyFilter('');
                          }}
                          className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          {t('admin.tickets.modal.clearFilters')}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Active status */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="isActive" className="text-sm text-gray-700 dark:text-gray-300">
                  {t('admin.tickets.form.isActive')}
                </label>
              </div>

              {/* Form actions */}
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 btn-secondary"
                >
                  {t('common.cancel')}
                </button>
                <button type="submit" className="flex-1 btn-primary">
                  {editingTicket ? t('common.update') : t('common.add')}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Generate tickets modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-dark-card rounded-lg p-6 max-w-md w-full"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('admin.tickets.generate.title')}
            </h3>

            <form onSubmit={handleGenerateTickets} className="space-y-4">
              <div>
                <label className="label">{t('admin.tickets.generate.count')}</label>
                <input
                  type="number"
                  value={generateForm.count}
                  onChange={(e) => setGenerateForm({ ...generateForm, count: parseInt(e.target.value) })}
                  className="input"
                  min="1"
                  max="200"
                  required
                />
              </div>

              <div>
                <label className="label">{t('admin.tickets.generate.questions_per_ticket')}</label>
                <input
                  type="number"
                  value={generateForm.questionsPerTicket}
                  onChange={(e) => setGenerateForm({ ...generateForm, questionsPerTicket: parseInt(e.target.value) })}
                  className="input"
                  min="5"
                  max="50"
                  required
                />
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-300">
                  <strong>{t('common.warning')}!</strong> {t('admin.tickets.generate.warning')}
                </p>
              </div>

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className="flex-1 btn-secondary"
                >
                  {t('common.cancel')}
                </button>
                <button type="submit" className="flex-1 btn-primary">
                  {t('admin.tickets.generate.confirm')}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, ticketId: null, loading: false })}
        onConfirm={handleDelete}
        title={t('admin.tickets.confirm.delete')}
        description={t('admin.tickets.confirm.deleteDescription')}
        loading={deleteModal.loading}
      />
    </div>
  );
};

export default TicketsPage;
