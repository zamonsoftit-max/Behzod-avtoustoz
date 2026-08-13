const router = require('express').Router();

router.use('/auth', require('./auth.routes'));
router.use('/users', require('./user.routes'));
router.use('/tests', require('./test.routes'));
router.use('/notifications', require('./notification.routes'));
router.use('/payments', require('./payment.routes'));
router.use('/public', require('./public.routes'));
router.use('/admin', require('./admin.routes'));

// Sog'liqni tekshirish
router.get('/health', (req, res) => {
  res.json({ success: true, status: 'ok', time: new Date().toISOString() });
});

module.exports = router;
