import axios from 'axios';
import toast from 'react-hot-toast';

const BASE = import.meta.env.VITE_API_URL || '/api';

/**
 * Central axios instance.
 * - Attaches Bearer token on every request
 * - Auto-refreshes expired JWT via httpOnly cookie and retries
 * - Queues concurrent requests during refresh so none are lost
 */
const api = axios.create({ baseURL: BASE, withCredentials: true, timeout: 15000 });

api.interceptors.request.use((cfg) => {
  const t = localStorage.getItem('accessToken');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

let refreshing = false;
let queue = [];
const flush = (err, token) => { queue.forEach(p => err ? p.reject(err) : p.resolve(token)); queue = []; };

const AUTH_PATHS = ['/auth/login', '/auth/register', '/auth/refresh-token', '/auth/forgot-password'];

api.interceptors.response.use(
  r => r,
  async (err) => {
    const orig = err.config;
    const isAuth = AUTH_PATHS.some(p => orig.url?.includes(p));

    if (err.response?.status === 401 && !orig._retry && !isAuth) {
      if (refreshing) {
        return new Promise((resolve, reject) => queue.push({ resolve, reject }))
          .then(t => { orig.headers.Authorization = `Bearer ${t}`; return api(orig); });
      }
      orig._retry = true;
      refreshing = true;
      try {
        const { data } = await axios.post(`${BASE}/auth/refresh-token`, {}, { withCredentials: true });
        localStorage.setItem('accessToken', data.accessToken);
        api.defaults.headers.common.Authorization = `Bearer ${data.accessToken}`;
        flush(null, data.accessToken);
        orig.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(orig);
      } catch (e) {
        flush(e, null);
        localStorage.removeItem('accessToken');
        setTimeout(() => { window.location.href = '/login'; }, 100);
        return Promise.reject(e);
      } finally { refreshing = false; }
    }
    if (err.response?.status >= 500) toast.error('Server error — please try again.');
    return Promise.reject(err);
  }
);

export default api;
