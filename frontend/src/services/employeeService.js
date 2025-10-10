import apiClient from './apiClient';

const EmployeeService = {
  async getEmployees() {
    const response = await apiClient.get('/employees');
    return response.data.data;
  },

  async getEmployee(id) {
    const response = await apiClient.get(`/employees/${id}`);
    return response.data.data;
  },

  async createEmployee(payload) {
    const response = await apiClient.post('/employees', payload);
    return response.data.data;
  },

  async updateEmployee(id, payload) {
    const response = await apiClient.put(`/employees/${id}`, payload);
    return response.data.data;
  },

  async deleteEmployee(id) {
    await apiClient.delete(`/employees/${id}`);
  }
};

export default EmployeeService;
