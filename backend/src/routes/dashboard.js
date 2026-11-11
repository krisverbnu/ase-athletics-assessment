const { Router } = require('express');
const controller = require('../controllers/dashboardController');
const validate = require('../middleware/validate');
const { dashboardQuerySchema } = require('../validators/dashboard');

const router = Router();

router.get('/stats', validate(dashboardQuerySchema, 'query'), controller.stats);

module.exports = router;
