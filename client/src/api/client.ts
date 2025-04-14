import axios from 'axios';

// Use environment variable or default to localhost
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

console.log("Using API URL:", API_URL);

// Get token from localStorage
export const getToken = () => localStorage.getItem('token');

// Create axios instance with auth header
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false // Explicitly disable credentials for CORS
});

// Add auth token to every request
apiClient.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default apiClient;