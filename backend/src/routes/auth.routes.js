const router = require('express').Router();
const ctrl = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

router.post('/register', authLimiter, ctrl.register);
router.post('/resend-registration-code', authLimiter, ctrl.resendRegistrationCode);
router.post('/verify-registration', authLimiter, ctrl.verifyRegistration);
router.post('/login', authLimiter, ctrl.login);
router.post('/verify-login', authLimiter, ctrl.verifyLogin);
router.post('/logout', ctrl.logout);
router.get('/me', protect, ctrl.me);
router.post('/refresh', ctrl.refresh);

router.post('/verify-code', authLimiter, ctrl.verifyCode);
router.post('/forgot-password', authLimiter, ctrl.forgotPassword);
router.post('/reset-password', authLimiter, ctrl.resetPassword);
router.put('/update-password', protect, ctrl.updatePassword);

module.exports = router;
