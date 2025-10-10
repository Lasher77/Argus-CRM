const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

router.get('/reports/dashboard', reportController.getDashboardSnapshot);
router.get('/reports/daily', reportController.getDailyReport);
router.get('/reports/weekly', reportController.getWeeklyReport);
router.get('/reports/revenue', reportController.getRevenueByMonth);

module.exports = router;
