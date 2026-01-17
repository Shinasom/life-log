import axios from 'axios';

// 1. Create the Axios Instance
const api = axios.create({
  baseURL: 'http://localhost:8000/api', // Your Django URL
  headers: {
    'Content-Type': 'application/json',
  },
});

// 2. Add an Interceptor to attach the Token
api.interceptors.request.use((config) => {
  // We will store the token in localStorage later
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 3. Export for use in components
export default api;