import apiClient from './apiClient';

const MaterialService = {
  async getMaterials() {
    const response = await apiClient.get('/materials');
    return response.data.data;
  },

  async getLowStock() {
    const response = await apiClient.get('/materials/low-stock');
    return response.data.data;
  },

  async getMaterial(id) {
    const response = await apiClient.get(`/materials/${id}`);
    return response.data.data;
  },

  async createMaterial(payload) {
    const response = await apiClient.post('/materials', payload);
    return response.data.data;
  },

  async updateMaterial(id, payload) {
    const response = await apiClient.put(`/materials/${id}`, payload);
    return response.data.data;
  },

  async deleteMaterial(id) {
    await apiClient.delete(`/materials/${id}`);
  },

  async adjustStock(id, delta) {
    const response = await apiClient.post(`/materials/${id}/adjust`, { delta });
    return response.data.data;
  }
};

export default MaterialService;
