import api from './axios.js';

export const insuranceApi = {
  create: (data) => api.post('/insurance-ssf', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  update: (id, data) => api.patch(`/insurance-ssf/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getByCandidate: (candidateId) => api.get('/insurance-ssf', { params: { candidateId } }),
  getExpiring: () => api.get('/insurance-ssf/expiring'),
  getIncompleteFeims: () => api.get('/insurance-ssf/incomplete-feims'),
  getMissingInsurance: () => api.get('/insurance-ssf/missing-insurance'),
  delete: (id) => api.delete(`/insurance-ssf/${id}`)
};

export default insuranceApi;