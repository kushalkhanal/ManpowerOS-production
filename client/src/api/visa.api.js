import api from './axios.js';

const visaApi = {
  getAll: (params) => api.get('/visa', { params }),
  getById: (id) => api.get(`/visa/${id}`),
  getByCandidate: (candidateId) => api.get('/visa/by-candidate', { params: { candidateId } }),
  create: (data) => api.post('/visa', data),
  update: (id, data, fileType) => {
    const params = fileType ? { fileType } : {};
    return api.patch(`/visa/${id}`, data, { params });
  },
  delete: (id) => api.delete(`/visa/${id}`)
};

export default visaApi;
