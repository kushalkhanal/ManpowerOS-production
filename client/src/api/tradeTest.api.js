import api from './axios.js';

const tradeTestApi = {
  getAll: (params) => api.get('/trade-tests', { params }),
  getById: (id) => api.get(`/trade-tests/${id}`),
  getByCandidate: (candidateId) => api.get('/trade-tests/by-candidate', { params: { candidateId } }),
  create: (data) => api.post('/trade-tests', data),
  update: (id, data) => api.patch(`/trade-tests/${id}`, data),
  delete: (id) => api.delete(`/trade-tests/${id}`)
};

export default tradeTestApi;
