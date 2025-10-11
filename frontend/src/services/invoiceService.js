import apiClient from './apiClient';

const InvoiceService = {
  async getInvoices() {
    const response = await apiClient.get('/invoices');
    return response.data.data;
  },

  async getInvoice(id) {
    const response = await apiClient.get(`/invoices/${id}`);
    return response.data.data;
  },

  async createInvoice(payload) {
    const response = await apiClient.post('/invoices', payload);
    return response.data.data;
  },

  async createFromQuote(quoteId, payload) {
    const response = await apiClient.post(`/quotes/${quoteId}/invoices`, payload);
    return response.data.data;
  },

  async updateInvoice(id, payload) {
    const response = await apiClient.put(`/invoices/${id}`, payload);
    return response.data.data;
  },

  async updateStatus(id, status) {
    const response = await apiClient.patch(`/invoices/${id}/status`, { status });
    return response.data.data;
  },

  async deleteInvoice(id) {
    await apiClient.delete(`/invoices/${id}`);
  },

  async getInvoicesBatch(ids) {
    const response = await apiClient.post('/invoices/batch', { ids });
    return response.data.data;
  },

  async sendInvoice(id, payload) {
    const response = await apiClient.post(`/invoices/${id}/send`, payload);
    return response.data;
  }
};

export default InvoiceService;
