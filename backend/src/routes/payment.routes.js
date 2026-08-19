const router = require('express').Router();
const ctrl = require('../controllers/payment.controller');
const { protect } = require('../middleware/auth');

// ===== Provayder webhook'lari (auth YO'Q — provayder serverlari chaqiradi) =====
router.post('/click/prepare', ctrl.clickPrepare);
router.post('/click/complete', ctrl.clickComplete);
router.post('/payme', ctrl.paymeGateway); // Payme JSON-RPC gateway

// ===== Ommaviy tariflar (auth talab qilinmaydi) =====
router.get('/plans', ctrl.getPlans);
router.get('/subscription-types', ctrl.getPlans);

// ===== Foydalanuvchi (auth majburiy) =====
router.use(protect);

router.post('/create', ctrl.create);
router.get('/history', ctrl.history);

router.post('/payme/create', ctrl.paymeCreate);
router.post('/payme/perform', ctrl.paymePerform);
router.post('/test/complete', ctrl.testComplete);

router.get('/:paymentId', ctrl.getOne);
router.get('/:paymentId/status', ctrl.getStatus);
router.post('/:paymentId/cancel', ctrl.cancel);

module.exports = router;
