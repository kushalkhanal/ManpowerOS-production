import api from './axios.js';

export const sharedDocumentsApi = {
  /**
   * Get the shared document record for a candidate or passport.
   * @param {string} entityType - 'candidate' | 'passport'
   * @param {string} entityId - The MongoDB ObjectId
   */
  getDocuments: (entityType, entityId) =>
    api.get(`/documents/${entityType}/${entityId}`),

  /**
   * Upload a document for a candidate or passport.
   * @param {string} entityType - 'candidate' | 'passport'
   * @param {string} entityId - The MongoDB ObjectId
   * @param {string} documentType - 'passport' | 'medical' | 'visa' | 'stamping' | 'orientation' | 'photo'
   * @param {File} file - The file to upload
   */
  uploadDocument: (entityType, entityId, documentType, file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);
    return api.post(`/documents/${entityType}/${entityId}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
};

export default sharedDocumentsApi;
