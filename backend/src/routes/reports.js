const { Router } = require('express');
const controller = require('../controllers/reportController');
const validate = require('../middleware/validate');
const { idParamSchema } = require('../validators/players');
const { reportSchema, updateReportSchema, reportListQuerySchema } = require('../validators/reports');

const router = Router();

router.get('/', validate(reportListQuerySchema, 'query'), controller.list);
router.post('/', validate(reportSchema), controller.create);
router.get('/:id', validate(idParamSchema, 'params'), controller.getOne);
router.put('/:id', validate(idParamSchema, 'params'), validate(updateReportSchema), controller.update);
router.delete('/:id', validate(idParamSchema, 'params'), controller.remove);

module.exports = router;
