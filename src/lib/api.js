import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const auth = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (email, password, name) => api.post('/auth/register', { email, password, name }),
};

export const stores = {
  status: () => api.get('/stores/status'),
  connectTN: (storeId, accessToken, storeName) =>
    api.post('/stores/tiendanube', { storeId, accessToken, storeName }),
  getMlAuthUrl: () => api.get('/stores/mercadolibre/url'),
};

export const products = {
  getTN: () => api.get('/products/tiendanube'),
  getML: () => api.get('/products/mercadolibre'),
  getMappings: () => api.get('/products/mappings'),
  createMapping: (data) => api.post('/products/mappings', data),
  deleteMapping: (id) => api.delete(`/products/mappings/${id}`),
  syncAll: () => api.post('/products/sync/initial'),
  syncOne: (id) => api.post(`/products/sync/${id}`),
  getLogs: (id) => api.get(`/products/mappings/${id}/logs`),
  autoMatch: () => api.get('/products/automatch'),
};

export const orders = {
  list: (params) => api.get('/orders', { params }),
  stats: () => api.get('/orders/stats/summary'),
};

export const catalog = {
  download: (params) => api.get('/catalog', { params, responseType: 'blob' }),
};

export default api;
