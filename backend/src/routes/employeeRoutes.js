const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const { authorizeRoles } = require('../middleware/authMiddleware');

router.get('/employees', employeeController.getEmployees);
router.get('/employees/:id', employeeController.getEmployeeById);
router.post('/employees', authorizeRoles('ADMIN'), employeeController.createEmployee);
router.put('/employees/:id', authorizeRoles('ADMIN'), employeeController.updateEmployee);
router.delete('/employees/:id', authorizeRoles('ADMIN'), employeeController.deleteEmployee);

module.exports = router;
