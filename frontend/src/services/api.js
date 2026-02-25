import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Don't set Content-Type for FormData (file uploads)
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle authentication errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token expired or invalid - redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const billService = {
  // Get all bills
  getAllBills: () => api.get('/bills'),
  
  // Get bill by ID
  getBillById: (id) => api.get(`/bills/${id}`),
  
  // Create new bill
  createBill: (billData) => api.post('/bills', billData),
  
  // Update bill
  updateBill: (id, billData) => api.put(`/bills/${id}`, billData),
  
  // Delete bill
  deleteBill: (id) => api.delete(`/bills/${id}`)
};

export default api;

export const deviceService = {
  getAllDevices: () => api.get('/devices'),
  getDeviceById: (id) => api.get(`/devices/${id}`),
  createDevice: (data) => api.post('/devices', data),
  updateDevice: (id, data) => api.put(`/devices/${id}`, data),
  deleteDevice: (id) => api.delete(`/devices/${id}`),
};
