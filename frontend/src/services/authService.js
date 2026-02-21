import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const authAPI = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if it exists
authAPI.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const authService = {
  // Initialize - clear tokens in development mode
  init: () => {
    if (process.env.NODE_ENV === 'development') {
      // Uncomment the line below if you want to always start logged out in development
      // authService.logout();
    }
  },

  // Register new user
  register: (userData) => authAPI.post('/auth/register', userData),
  
  // Login user
  login: (credentials) => authAPI.post('/auth/login', credentials),
  
  // Get current user
  getCurrentUser: () => authAPI.get('/auth/me'),
  
  // Logout (clear local storage)
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  
  // Check if user is logged in
  isAuthenticated: () => {
    const token = localStorage.getItem('token');
    if (!token) return false;
    
    try {
      // Decode JWT token to check expiration
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      
      if (payload.exp < currentTime) {
        // Token is expired, clear storage
        authService.logout();
        return false;
      }
      
      return true;
    } catch (error) {
      // Invalid token, clear storage
      authService.logout();
      return false;
    }
  },
  
  // Get stored user
  getStoredUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
  
  // Store user data
  storeUser: (user, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  },
};

export default authAPI;
