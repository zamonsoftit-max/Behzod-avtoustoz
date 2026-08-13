const router = require('express').Router();
const ctrl = require('../controllers/public.controller');

router.get('/settings', ctrl.getPublicSettings);

module.exports = router;
