const { Router } = require('express');
const controller = require('../controllers/playerController');
const validate = require('../middleware/validate');
const {
  listQuerySchema, searchQuerySchema, playerSchema, updatePlayerSchema, idParamSchema,
} = require('../validators/players');

const router = Router();

// Specific paths MUST come before "/:id", or Express would treat "search" as an id
router.get('/search', validate(searchQuerySchema, 'query'), controller.search);
router.get('/filters', controller.filterOptions);

router.get('/', validate(listQuerySchema, 'query'), controller.list);
router.post('/', validate(playerSchema), controller.create);
router.get('/:id', validate(idParamSchema, 'params'), controller.getOne);
router.put('/:id', validate(idParamSchema, 'params'), validate(updatePlayerSchema), controller.update);
router.delete('/:id', validate(idParamSchema, 'params'), controller.remove);

module.exports = router;
