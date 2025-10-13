import apiClient from './apiClient';

const withData = (response) => response.data?.data ?? response.data;

export const fetchTemplates = async () => {
  const response = await apiClient.get('/templates');
  return withData(response) ?? [];
};

export const fetchTemplate = async (id) => {
  const response = await apiClient.get(`/templates/${id}`);
  return withData(response);
};

export const createTemplate = async (payload) => {
  const response = await apiClient.post('/templates', payload);
  return withData(response);
};

export const updateTemplate = async (id, payload) => {
  const response = await apiClient.put(`/templates/${id}`, payload);
  return withData(response);
};

export const deleteTemplate = async (id) => {
  await apiClient.delete(`/templates/${id}`);
};

export const duplicateTemplate = async (id) => {
  const response = await apiClient.post(`/templates/${id}/duplicate`);
  return withData(response);
};

export const fetchPlaceholders = async () => {
  const response = await apiClient.get('/templates/placeholders');
  return withData(response) ?? [];
};

export const fetchMockData = async () => {
  const response = await apiClient.get('/templates/mock-data');
  return withData(response);
};

export const previewTemplate = async (payload) => {
  const response = await apiClient.post('/templates/preview', payload);
  return withData(response);
};

export const renderPdf = async (id, data) => {
  const response = await apiClient.post(
    `/templates/${id}/render`,
    { data },
    { responseType: 'blob' }
  );
  return response.data;
};

export const listTemplateAssets = async () => {
  const response = await apiClient.get('/template-assets');
  return withData(response) ?? [];
};

export const uploadTemplateAsset = async (file) => {
  const formData = new FormData();
  formData.append('asset', file);
  const response = await apiClient.post('/template-assets', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return withData(response);
};

const templateService = {
  fetchTemplates,
  fetchTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  duplicateTemplate,
  fetchPlaceholders,
  fetchMockData,
  previewTemplate,
  renderPdf,
  listTemplateAssets,
  uploadTemplateAsset
};

export default templateService;
