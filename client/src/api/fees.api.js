import api from './axios.js';

export const feesApi = {
  create: (data) => api.post('/fees', data),
  getAll: (params) => api.get('/fees', { params }),
  getById: (id) => api.get(`/fees/${id}`),
  update: (id, data) => api.patch(`/fees/${id}`, data),
  delete: (id) => api.delete(`/fees/${id}`),
  getSummary: (params) => api.get('/fees/summary', { params }),
  getCandidateSummary: (candidateId) => api.get(`/fees/candidate/${candidateId}`)
};

export default feesApi;