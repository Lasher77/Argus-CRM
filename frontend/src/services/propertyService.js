import apiClient from './apiClient';

const PropertyService = {
  async searchProperties(query, options = {}) {
    const response = await apiClient.get('/properties/search', {
      params: {
        q: query,
        accountId: options.accountId,
        limit: options.limit
      }
    });
    return response.data;
  }
};

export default PropertyService;
