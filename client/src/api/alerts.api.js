import api from './axios.js';

export const alertsApi = {
  getAll: () => api.get('/alerts'),
  getCounts: () => api.get('/alerts/counts'),
  create: (data) => api.post('/alerts', data)
};

export default alertsApi;