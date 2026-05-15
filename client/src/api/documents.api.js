import api from './axios.js';

export const documentsApi = {
  getAll: (params) => api.get('/agency-docs', { params }),
  getById: (id) => api.get(`/agency-docs/${id}`),
  create: (data) => api.post('/agency-docs', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  update: (id, data) => api.patch(`/agency-docs/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  delete: (id) => api.delete(`/agency-docs/${id}`),
  getExpiring: (params) => api.get('/agency-docs/expiring', { params }),
  download: (id) => api.get(`/agency-docs/${id}/download`, { responseType: 'blob' })
};

export default documentsApi;