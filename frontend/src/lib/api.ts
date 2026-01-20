import axios from 'axios';
import Cookies from 'js-cookie';

// 1. Point explicitly to your Django API
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 2. Request Interceptor: Attach Token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    // Try LocalStorage first (for API)
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// 3. Response Interceptor: Handle 401 (Unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear all auth data to prevent loops
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      Cookies.remove('accessToken', { path: '/' });
      
      // Optional: Redirect to login
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
         window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;