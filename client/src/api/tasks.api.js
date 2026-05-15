import api from './axios.js';

export const tasksApi = {
  getAll: (params) => api.get('/tasks', { params }),
  getById: (id) => api.get(`/tasks/${id}`),
  create: (data) => api.post('/tasks', data),
  update: (id, data) => api.patch(`/tasks/${id}`, data),
  updateStatus: (id, data) => api.patch(`/tasks/${id}/status`, data),
  delete: (id) => api.delete(`/tasks/${id}`),
  getMyTasks: (params) => api.get('/tasks/my', { params }),
  getByCandidate: (candidateId) => api.get(`/tasks/candidate/${candidateId}`),
  getStats: () => api.get('/tasks/stats')
};

export default tasksApi;