import apiClient from './apiClient';

const ContactService = {
  async searchContacts(query, options = {}) {
    const response = await apiClient.get('/contacts/search', {
      params: {
        q: query,
        accountId: options.accountId,
        limit: options.limit
      }
    });
    return response.data;
  }
};

export default ContactService;
