import API from './axios';

export const superAdminApi = {
  getStats: () => API.get('/superadmin/stats'),
  getAllAgencies: () => API.get('/superadmin/agencies'),
  updateAgencyStatus: (id, isActive) => API.patch(`/superadmin/agencies/${id}/status`, { isActive }),
  deleteAgency: (id) => API.delete(`/superadmin/agencies/${id}`),
  impersonateAgency: (id) => API.post(`/superadmin/agencies/${id}/impersonate`),
  createAdminForAgency: (id, data) => API.post(`/superadmin/agencies/${id}/create-admin`, data),
  listAgencyAdmins: (id) => API.get(`/superadmin/agencies/${id}/admins`),
  deleteAgencyAdmin: (id, userId) => API.delete(`/superadmin/agencies/${id}/admins/${userId}`),
  updateAgencyPlan: (id, data) => API.patch(`/superadmin/agencies/${id}/plan`, data)
};

export default superAdminApi;
