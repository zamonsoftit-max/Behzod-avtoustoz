const router = require('express').Router();
const ctrl = require('../controllers/user.controller');
const { protect } = require('../middleware/auth');
const { uploadAvatar } = require('../middleware/upload');

router.use(protect);

router.get('/profile', ctrl.getProfile);
router.put('/profile', ctrl.updateProfile);
router.post('/profile/avatar', uploadAvatar, ctrl.uploadAvatar);

router.get('/dashboard/stats', ctrl.getDashboardStats);
router.get('/statistics', ctrl.getStatistics);
router.get('/test-history', ctrl.getTestHistory);

router.put('/settings/language', ctrl.updateLanguage);
router.put('/settings/theme', ctrl.updateTheme);

router.delete('/account', ctrl.deleteAccount);

module.exports = router;
