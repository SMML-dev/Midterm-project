import axios from 'axios';
const getBaseURL = () => {
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    // Development mode
    // Try to detect platform and use appropriate URL
    if (typeof window !== 'undefined') {
      // Web browser
      return 'http://localhost:3000/api';
    }
    return 'http://localhost:3000/api';
  }
  return process.env.API_URL || 'http://localhost:3000/api';
};

const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method?.toUpperCase(), config.url);
    console.log('Full URL:', config.baseURL + config.url);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('API Error:', error.message);
    if (error.response) {
      console.error('Error Status:', error.response.status);
      console.error('Error Data:', error.response.data);
      console.error('Error Message from Server:', error.response.data?.message || 'No message');
    } else if (error.request) {
      console.error('No response received. Is the server running?');
      console.error('Request was made but no response received');
    } else {
      console.error('Error setting up request:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;

