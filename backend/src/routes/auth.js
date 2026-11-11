const { Router } = require('express');
const controller = require('../controllers/authController');
const validate = require('../middleware/validate');
const requireAuth = require('../middleware/auth');
const { registerSchema, loginSchema } = require('../validators/auth');

const router = Router();

router.post('/register', validate(registerSchema), controller.register);
router.post('/login', validate(loginSchema), controller.login);
router.post('/logout', requireAuth, controller.logout);
router.get('/me', requireAuth, controller.me);

module.exports = router;
