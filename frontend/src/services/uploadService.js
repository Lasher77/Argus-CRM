import apiClient from './apiClient';

const UploadService = {
  async createPresignedUpload({ fileName, fileType, fileSize, prefix }) {
    const response = await apiClient.post('/uploads/presign', {
      fileName,
      fileType,
      fileSize,
      prefix,
    });
    return response.data.data;
  },
};

export default UploadService;
