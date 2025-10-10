import apiClient from './apiClient';

const ReportService = {
  async getDashboardSnapshot() {
    const response = await apiClient.get('/reports/dashboard');
    return response.data.data;
  },

  async getDailyReport(date) {
    const response = await apiClient.get('/reports/daily', { params: { date } });
    return response.data.data;
  },

  async getWeeklyReport(start, end) {
    const response = await apiClient.get('/reports/weekly', { params: { start, end } });
    return response.data.data;
  },

  async getRevenueByMonth(year) {
    const response = await apiClient.get('/reports/revenue', { params: { year } });
    return response.data.data;
  }
};

export default ReportService;
