import axios from 'axios';

// Detect Docker environment - server is mapped to port 5001 in Docker
const isDocker = window.location.hostname === 'localhost';
const API_URL = process.env.REACT_APP_API_URL || (isDocker ? 'http://localhost:5001' : 'http://notion-server:5001');

console.log("Using API URL:", API_URL);

// Get token from localStorage
export const getToken = () => localStorage.getItem('token');

// Create axios instance with auth header
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  }
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