import api from './axios.js';

const contractApi = {
  getAll: (params) => api.get('/contracts', { params }),
  getById: (id) => api.get(`/contracts/${id}`),
  getByCandidate: (candidateId) => api.get('/contracts/by-candidate', { params: { candidateId } }),
  getExpiring: (days) => api.get('/contracts/expiring', { params: { days } }),
  create: (data) => api.post('/contracts', data),
  update: (id, data) => api.patch(`/contracts/${id}`, data),
  delete: (id) => api.delete(`/contracts/${id}`)
};

export default contractApi;
