import api from './axios.js';

const hasFile = (data) =>
  data && typeof data === 'object' && Object.values(data).some((v) => v instanceof File || v instanceof Blob);

const toFormData = (data) => {
  const fd = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (value instanceof File || value instanceof Blob) {
      fd.append(key, value);
    } else if (typeof value === 'object') {
      fd.append(key, JSON.stringify(value));
    } else {
      fd.append(key, value);
    }
  });
  return fd;
};

export const demandsApi = {
  create: (data) => api.post('/demands', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getAll: (params) => api.get('/demands', { params }),
  getById: (id) => api.get(`/demands/${id}`),
  update: (id, data) => hasFile(data)
    ? api.patch(`/demands/${id}`, toFormData(data), { headers: { 'Content-Type': 'multipart/form-data' } })
    : api.patch(`/demands/${id}`, data),
  delete: (id) => api.delete(`/demands/${id}`),
  getExpiring: () => api.get('/demands/expiring'),
  getEligibleCandidates: (id) => api.get(`/demands/${id}/eligible-candidates`),
  assignCandidate: (id, candidateId) => api.post(`/demands/${id}/assign`, { candidateId }),
  removeCandidate: (id, candidateId) => api.delete(`/demands/${id}/assign/${candidateId}`),
  toggleInterview: (id, candidateId) => api.patch(`/demands/${id}/interview/${candidateId}`),
  exportCandidates: (id, filter = 'all') => api.get(`/demands/${id}/export`, {
    params: { filter },
    responseType: 'blob',
  }),
};

export default demandsApi;