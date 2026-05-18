import api from './axios.js';

export const passportsApi = {
  getAll: (params) => api.get('/passports', { params }),
  getById: (id) => api.get(`/passports/${id}`),
  create: (data) => api.post('/passports', data),
  update: (id, data) => api.patch(`/passports/${id}`, data),
  updateStatus: (id, data) => api.patch(`/passports/${id}/status`, data),
  delete: (id) => api.delete(`/passports/${id}`),
  ensureCandidate: (id) => api.post(`/passports/${id}/ensure-candidate`),
  getExpiring: () => api.get('/passports/expiring'),
  scan: (file) => {
    const formData = new FormData();
    formData.append('passportImage', file);
    return api.post('/passports/scan', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
};

export default passportsApi;