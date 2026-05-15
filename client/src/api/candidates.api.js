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

export const candidatesApi = {
  getAll: (params) => api.get('/candidates', { params }),
  getById: (id) => api.get(`/candidates/${id}`),
  getKanban: (id) => api.get(`/candidates/${id}/kanban`),
  create: (data) => api.post('/candidates', data),
  update: (id, data) => hasFile(data)
    ? api.patch(`/candidates/${id}`, toFormData(data), { headers: { 'Content-Type': 'multipart/form-data' } })
    : api.patch(`/candidates/${id}`, data),
  delete: (id) => api.delete(`/candidates/${id}`),
  getAgents: () => api.get('/candidates/agents'),
  export: (params) => api.get('/candidates/export', { params, responseType: 'blob' }),
  exportBatch: (ids) => api.post('/candidates/export-batch', { ids }),
  markColumnComplete: (id, columnId) => api.patch(`/candidates/${id}/mark-column-complete`, { columnId }),
  toggleChecklistItem: (id, columnId, itemKey, done) => api.patch(`/candidates/${id}/checklist-item`, { columnId, itemKey, done }),
  resetChecklistColumn: (id, columnId) => api.patch(`/candidates/${id}/checklist-reset`, { columnId }),
  getActivityLogs: (id, params) => api.get(`/candidates/${id}/activity-logs`, { params }),
  saveStageNote: (id, columnId, note) => api.patch(`/candidates/${id}/stage-note`, { columnId, note }),
  unassignFromDemand: (id) => api.patch(`/candidates/${id}/unassign-from-demand`),
  bulkUpdateStatus: (candidateIds, status) => api.patch('/candidates/bulk-status', { candidateIds, status }),
  printBundle: (id) => api.get(`/candidates/${id}/print-bundle`)
};

export default candidatesApi;