import axios from 'axios';
import { getItem, clearSession } from '../lib/storage.js';

const SERVER_URL = import.meta.env.VITE_SERVER_URL?.trim() || '';
const API_URL = SERVER_URL ? `${SERVER_URL}/api` : '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

const normalizeError = (error) => {
  const response = error.response;
  const message = response?.data?.message || error.message || 'Unknown error';
  return Object.assign(error, {
    message,
    status: response?.status,
    data: response?.data
  });
};

api.interceptors.request.use((config) => {
  const token = getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const handleUnauthorized = () => {
  clearSession();
  window.dispatchEvent(new Event('force-logout'));
};

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || 'unknown';
    if (status === 401 && !url.includes('/auth/login')) {
      handleUnauthorized();
    }
    return Promise.reject(normalizeError(error));
  }
);

export default api;