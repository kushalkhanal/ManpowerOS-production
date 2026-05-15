import api from './axios.js';

export const orientationApi = {
  create: (data) => api.post('/orientation', data),
  update: (id, data) => api.patch(`/orientation/${id}`, data),
  updateWithFile: (id, formData) => api.patch(`/orientation/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getByCandidate: (candidateId) => api.get('/orientation', { params: { candidateId } }),
  getUpcoming: () => api.get('/orientation/upcoming'),
  getMissingCertificates: () => api.get('/orientation/missing-certificates'),
  getBoard:     () => api.get('/orientation/board'),
  bulkStatus:   (orientationIds, completionStatus) => api.patch('/orientation/bulk-status', { orientationIds, completionStatus }),
  delete: (id) => api.delete(`/orientation/${id}`),
  uploadCertificate: (id, formData) => api.post(`/orientation/${id}/certificate`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteCertificate: (id) => api.delete(`/orientation/${id}/certificate`),
  uploadAttendanceSheet: (id, formData) => api.post(`/orientation/${id}/attendance-sheet`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteAttendanceSheet: (id) => api.delete(`/orientation/${id}/attendance-sheet`)
};

export default orientationApi;