const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authorizeRoles } = require('../middleware/authMiddleware');

router.get('/reports/dashboard', authorizeRoles('ACCOUNTING', 'ADMIN'), reportController.getDashboardSnapshot);
router.get('/reports/daily', authorizeRoles('ACCOUNTING', 'ADMIN'), reportController.getDailyReport);
router.get('/reports/weekly', authorizeRoles('ACCOUNTING', 'ADMIN'), reportController.getWeeklyReport);
router.get('/reports/revenue', authorizeRoles('ACCOUNTING', 'ADMIN'), reportController.getRevenueByMonth);

module.exports = router;
