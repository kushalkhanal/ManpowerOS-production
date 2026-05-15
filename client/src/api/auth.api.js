import api from './axios.js';

export const authApi = {
  login: (data) => api.post('/auth/login', data),
  registerAgency: (data) => api.post('/auth/register-agency', data),
  registerAgencyPublic: (data) => api.post('/auth/register-agency-public', data),
  getMe: () => api.get('/auth/me'),
  changePassword: (data) => api.post('/auth/change-password', data),
  inviteUser: (data) => api.post('/auth/invite-user', data)
};

export default authApi;