import api from './axios.js';

export const passportPoolApi = {
  getPoolPassports: (params) => api.get('/passports/pool', { params }),
  getAllocatedPassports: (params) => api.get('/passports/pool/allocated', { params }),
  getMatchingPassports: (demandId) => api.get(`/passports/pool/match?demandId=${demandId}`),
  getActiveDemands: () => api.get('/passports/pool/demands'),
  getPoolStats: () => api.get('/passports/pool/stats'),
  allocate: (data) => api.post('/passports/pool/allocate', data),
  deallocate: (passportId, reason) => api.post(`/passports/pool/deallocate/${passportId}`, { reason })
};

export default passportPoolApi;