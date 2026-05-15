import api from './axios.js';

export const agenciesApi = {
  getById: (id) => api.get(`/agencies/${id}`),
  update: (id, data) => api.patch(`/agencies/${id}`, data),
  getUsage: (id) => api.get(`/agencies/${id}/usage`)
};

export default agenciesApi;