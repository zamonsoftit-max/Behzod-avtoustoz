const router = require('express').Router();
const ctrl = require('../controllers/test.controller');
const { protect, requireSubscription } = require('../middleware/auth');

// ===== Ochiq (demo) — auth talab qilinmaydi =====
router.get('/demo/questions', ctrl.getDemoQuestions);
router.post('/demo/submit', ctrl.submitDemo);

// ===== Quyidagilar uchun auth majburiy =====
router.use(protect);

// Faqat ko'rish (obuna shart emas)
router.get('/topics', ctrl.getTopics);
router.get('/tickets', ctrl.getTickets);
router.get('/results', ctrl.getResults);
router.get('/results/:id', ctrl.getResultById);
router.get('/ticket-statistics', ctrl.getTicketStatistics);
router.post('/ticket-statistics', ctrl.saveTicketStatistics);

// Test yechish — faol obuna talab qilinadi
router.get('/questions/topic/:topicId', requireSubscription, ctrl.getQuestionsByTopic);
router.get('/questions/ticket/:ticketId', requireSubscription, ctrl.getQuestionsByTicket);
router.get('/questions/random', requireSubscription, ctrl.getRandomQuestions);
router.get('/questions/exam', requireSubscription, ctrl.getExamQuestions);
router.get('/questions/wrong', requireSubscription, ctrl.getWrongQuestions);

router.post('/start', requireSubscription, ctrl.startTest);
router.post('/submit', requireSubscription, ctrl.submitTest);

// Sessiyaga oid (param) — eng oxirida
router.get('/:testId/progress', requireSubscription, ctrl.getProgress);
router.put('/:testId/progress', requireSubscription, ctrl.saveProgress);
router.post('/:testId/submit', requireSubscription, ctrl.submitSession);

module.exports = router;
