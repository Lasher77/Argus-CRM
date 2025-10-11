const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const { authorizeRoles } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const { idParamSchema } = require('../validation/schemas/commonSchemas');
const { createEmployeeSchema, updateEmployeeSchema } = require('../validation/schemas/employeeSchemas');

router.get('/employees', employeeController.getEmployees);
router.get('/employees/:id', validate(idParamSchema, 'params'), employeeController.getEmployeeById);
router.post('/employees', authorizeRoles('ADMIN'), validate(createEmployeeSchema), employeeController.createEmployee);
router.put(
  '/employees/:id',
  authorizeRoles('ADMIN'),
  validate(idParamSchema, 'params'),
  validate(updateEmployeeSchema),
  employeeController.updateEmployee
);
router.delete(
  '/employees/:id',
  authorizeRoles('ADMIN'),
  validate(idParamSchema, 'params'),
  employeeController.deleteEmployee
);

module.exports = router;
