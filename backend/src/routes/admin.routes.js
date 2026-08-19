const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const { uploadQuestionImage, uploadTopicImage } = require('../middleware/upload');

const dashboard = require('../controllers/admin/dashboard.controller');
const users = require('../controllers/admin/users.controller');
const questions = require('../controllers/admin/questions.controller');
const topics = require('../controllers/admin/topics.controller');
const tickets = require('../controllers/admin/tickets.controller');
const payments = require('../controllers/admin/payments.controller');
const reports = require('../controllers/admin/reports.controller');
const settings = require('../controllers/admin/settings.controller');
const notifications = require('../controllers/admin/notifications.controller');

// Barcha admin route'lar uchun: kirgan + admin roli
router.use(protect, authorize('admin'));

// Dashboard
router.get('/dashboard/stats', dashboard.getStats);

// Users
router.get('/users', users.list);
router.get('/users/:id', users.getOne);
router.put('/users/:id', users.update);
router.put('/users/:id/status', users.updateStatus);
router.post('/users/:id/reset-password', users.resetPassword);
router.delete('/users/:id', users.remove);

// Questions (rasm yuklash bilan)
router.get('/questions', questions.list);
router.post('/questions', uploadQuestionImage, questions.create);
router.put('/questions/:id', uploadQuestionImage, questions.update);
router.delete('/questions/:id', questions.remove);

// Topics
router.get('/topics', topics.list);
router.post('/topics', uploadTopicImage, topics.create);
router.put('/topics/:id', uploadTopicImage, topics.update);
router.delete('/topics/:id', topics.remove);

// Tickets
router.get('/tickets', tickets.list);
router.post('/tickets/generate', tickets.generate);
router.post('/tickets', tickets.create);
router.get('/tickets/:id/questions', tickets.getQuestions);
router.put('/tickets/:id', tickets.update);
router.delete('/tickets/:id', tickets.remove);

// Payments
router.get('/payments', payments.list);
router.get('/payments/stats', payments.stats);
router.put('/payments/:paymentId/confirm', payments.confirm);
router.post('/payments/:paymentId/refund', payments.refund);

// Reports
router.get('/reports', reports.getReports);
router.post('/reports/export', reports.exportReport);

// Settings
router.get('/settings', settings.get);
router.put('/settings', settings.update);

// Notifications
router.post('/notifications/bulk', notifications.bulkSend);

module.exports = router;
