import api from './axios.js';

export const staffApi = {
  getAll: (params) => api.get('/staff', { params }),
  getById: (id) => api.get(`/staff/${id}`),
  getActivity: (id) => api.get(`/staff/${id}/activity`),
  getCandidates: (id) => api.get(`/staff/${id}/candidates`),
  getOnline: () => api.get('/staff/online'),
  invite: (data) => api.post('/staff/invite', data),
  update: (id, data) => api.patch(`/staff/${id}`, data),
  toggle: (id) => api.patch(`/staff/${id}/toggle`),
  delete: (id) => api.delete(`/staff/${id}`),
  resetPassword: (id) => api.post(`/staff/${id}/reset-password`),
  updatePermissions: (id, permissions) => api.patch(`/staff/${id}/permissions`, { permissions })
};

export default staffApi;