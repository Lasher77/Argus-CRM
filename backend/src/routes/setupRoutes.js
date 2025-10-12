const express = require('express');
const router = express.Router();
const setupController = require('../controllers/setupController');
const { validate } = require('../middleware/validationMiddleware');
const { setupSchema } = require('../validation/schemas/setupSchemas');

router.get('/', setupController.status);
router.post('/', validate(setupSchema), setupController.setup);

module.exports = router;
