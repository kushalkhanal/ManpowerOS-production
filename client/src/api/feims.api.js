import api from './axios.js';

export const feimsApi = {
  getQueue:           ()             => api.get('/feims/queue'),
  getChecklist:       (candidateId) => api.get(`/feims/checklist/${candidateId}`),
  getPacket:          (candidateId) => api.get(`/feims/packet/${candidateId}`),
  getCandidateStatus: (candidateId) => api.get(`/feims/candidate-status/${candidateId}`),
  getDepartureGate:   (candidateId) => api.get(`/feims/departure-gate/${candidateId}`),
  updateRegistration: (candidateId, data) => api.patch(`/feims/${candidateId}/registration`, data),
  updateShram:        (candidateId, data) => api.patch(`/feims/${candidateId}/shram`, data)
};

export default feimsApi;
