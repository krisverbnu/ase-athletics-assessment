// The route map: which URL prefix goes to which group of routes
const { Router } = require('express');
const requireAuth = require('../middleware/auth');

const router = Router();

// Public
router.get('/health', (req, res) => res.json({ status: 'ok' }));
router.use('/auth', require('./auth'));

// Everything below needs a valid login token
router.use('/players', requireAuth, require('./players'));
router.use('/dashboard', requireAuth, require('./dashboard'));
router.use('/reports', requireAuth, require('./reports'));

module.exports = router;
