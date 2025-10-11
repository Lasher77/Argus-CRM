import apiClient from './apiClient';

const ServiceOrderService = {
  async getServiceOrders(params = {}) {
    const response = await apiClient.get('/service-orders', { params });
    return response.data.data;
  },

  async getServiceOrder(id) {
    const response = await apiClient.get(`/service-orders/${id}`);
    return response.data.data;
  },

  async createServiceOrder(payload) {
    const response = await apiClient.post('/service-orders', payload);
    return response.data.data;
  },

  async updateServiceOrder(id, payload) {
    const response = await apiClient.put(`/service-orders/${id}`, payload);
    return response.data.data;
  },

  async updateStatus(id, status) {
    const response = await apiClient.patch(`/service-orders/${id}/status`, { status });
    return response.data.data;
  },

  async deleteServiceOrder(id) {
    await apiClient.delete(`/service-orders/${id}`);
  },

  async checkIn(orderId, payload) {
    const response = await apiClient.post(`/service-orders/${orderId}/check-in`, payload);
    return response.data;
  },

  async addTimeEntry(orderId, payload) {
    const response = await apiClient.post(`/service-orders/${orderId}/time-entries`, payload);
    return response.data.data;
  },

  async updateTimeEntry(entryId, payload) {
    const response = await apiClient.put(`/time-entries/${entryId}`, payload);
    return response.data.data;
  },

  async deleteTimeEntry(entryId) {
    const response = await apiClient.delete(`/time-entries/${entryId}`);
    return response.data.data;
  },

  async addMaterialUsage(orderId, payload) {
    const response = await apiClient.post(`/service-orders/${orderId}/material-usage`, payload);
    return response.data.data;
  },

  async updateMaterialUsage(usageId, payload) {
    const response = await apiClient.put(`/material-usage/${usageId}`, payload);
    return response.data.data;
  },

  async deleteMaterialUsage(usageId) {
    const response = await apiClient.delete(`/material-usage/${usageId}`);
    return response.data.data;
  },

  async addPhoto(orderId, payload) {
    const response = await apiClient.post(`/service-orders/${orderId}/photos`, payload);
    return response.data.data;
  },

  async deletePhoto(orderId, photoId) {
    const response = await apiClient.delete(`/service-orders/${orderId}/photos/${photoId}`);
    return response.data.data;
  },

  async setSignature(orderId, payload) {
    const response = await apiClient.post(`/service-orders/${orderId}/signature`, payload);
    return response.data.data;
  },

  async clearSignature(orderId) {
    const response = await apiClient.delete(`/service-orders/${orderId}/signature`);
    return response.data.data;
  }
};

export default ServiceOrderService;
