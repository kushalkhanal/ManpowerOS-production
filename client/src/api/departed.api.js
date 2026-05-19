import api from "./axios";

export const departedApi = {
  markDeparted: (candidateId) =>
    api.post(`/candidates/${candidateId}/depart`),

  getAll: (params = {}) =>
    api.get("/departed", { params }),

  getById: (id) =>
    api.get(`/departed/${id}`),

  updateReturnStatus: (id, data) =>
    api.patch(`/departed/${id}/return-status`, data),

  getStats: () =>
    api.get("/departed/stats"),
};
