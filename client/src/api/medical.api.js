import api from './axios.js';

export const medicalApi = {
  create: (data) => api.post('/medical', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  update: (id, data) => api.patch(`/medical/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getByCandidate: (candidateId) => api.get('/medical', { params: { candidateId } }),
  getExpiring: () => api.get('/medical/expiring'),
  getRechecks: () => api.get('/medical/rechecks'),
  getBoard:    () => api.get('/medical/board'),
  bulkResult:  (medicalIds, result) => api.patch('/medical/bulk-result', { medicalIds, result }),
  delete: (id) => api.delete(`/medical/${id}`)
};

export default medicalApi;