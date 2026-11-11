const { Router } = require('express');
const controller = require('../controllers/authController');
const validate = require('../middleware/validate');
const requireAuth = require('../middleware/auth');
const { registerSchema, loginSchema } = require('../validators/auth');
const { loginLimiter, registerLimiter } = require('../middleware/rateLimit');

const router = Router();

// The limiter runs first, so blocked requests never reach the database or bcrypt
router.post('/register', registerLimiter, validate(registerSchema), controller.register);
router.post('/login', loginLimiter, validate(loginSchema), controller.login);
router.post('/logout', requireAuth, controller.logout);
router.get('/me', requireAuth, controller.me);

module.exports = router;
