const router = require('express').Router();
const ctrl = require('../controllers/notification.controller');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', ctrl.list);
router.get('/unread-count', ctrl.unreadCount);
router.get('/preferences', ctrl.getPreferences);
router.put('/preferences', ctrl.updatePreferences);

router.put('/mark-all-read', ctrl.markAllRead);
router.delete('/clear-all', ctrl.clearAll);

router.put('/:id/read', ctrl.markRead);
router.delete('/:id', ctrl.remove);

module.exports = router;
