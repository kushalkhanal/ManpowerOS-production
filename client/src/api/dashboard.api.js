import api from './axios.js';

export const dashboardApi = {
  getOverview: () => api.get('/dashboard/overview')
};

export default dashboardApi;
