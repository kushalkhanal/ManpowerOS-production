import api from './axios.js';

export const sponsorsApi = {
  getAll: (params) => api.get('/sponsors', { params }),
  getById: (id) => api.get(`/sponsors/${id}`),
  create: (data) => api.post('/sponsors', data),
  update: (id, data) => api.patch(`/sponsors/${id}`, data),
  updateRole: (id, data) => api.patch(`/sponsors/${id}/role`, data),
  updatePermissions: (id, data) => api.patch(`/sponsors/${id}/permissions`, data),
  assignStaff: (id, data) => api.patch(`/sponsors/${id}/assign-staff`, data),
  invitePortal: (id) => api.patch(`/sponsors/${id}/invite-portal`),
  toggleActive: (id, data) => api.patch(`/sponsors/${id}/toggle-active`, data),
  delete: (id) => api.delete(`/sponsors/${id}`),
  getCandidates: (id, params) => api.get(`/sponsors/${id}/candidates`, { params }),
  getStats: () => api.get('/sponsors/stats/overview'),
  search: (q) => api.get('/sponsors/search', { params: { q } })
};

export default sponsorsApi;