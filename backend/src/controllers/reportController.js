const Report = require('../models/report');

const handleError = (res, error, message = 'Interner Serverfehler') => {
  console.error(message, error);
  res.status(500).json({ success: false, message });
};

exports.getDashboardSnapshot = (req, res) => {
  try {
    const snapshot = Report.getDashboardSnapshot();
    res.json({ success: true, data: snapshot });
  } catch (error) {
    handleError(res, error, 'Fehler beim Laden der Dashboard-Daten');
  }
};

exports.getDailyReport = (req, res) => {
  try {
    const { date } = req.query;
    const report = Report.getDailyReport(date);
    res.json({ success: true, data: report });
  } catch (error) {
    handleError(res, error, 'Fehler beim Erstellen des Tagesreports');
  }
};

exports.getWeeklyReport = (req, res) => {
  try {
    const { start, end } = req.query;
    const report = Report.getWeeklyReport(start, end);
    res.json({ success: true, data: report });
  } catch (error) {
    handleError(res, error, 'Fehler beim Erstellen des Wochenreports');
  }
};

exports.getRevenueByMonth = (req, res) => {
  try {
    const { year } = req.query;
    const report = Report.getRevenueByMonth(year);
    res.json({ success: true, data: report });
  } catch (error) {
    handleError(res, error, 'Fehler beim Berechnen der Umsätze');
  }
};
