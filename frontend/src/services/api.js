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

export const renewableService = {
  // Source operations
  createSource: (sourceData) => api.post('/renewable/sources', sourceData),
  getSources: (params) => api.get('/renewable/sources', { params }),
  getSourceById: (id) => api.get(`/renewable/sources/${id}`),
  updateSource: (id, sourceData) => api.put(`/renewable/sources/${id}`, sourceData),
  deleteSource: (id) => api.delete(`/renewable/sources/${id}`),
  
  // Record operations
  createRecord: (recordData) => api.post('/renewable/records', recordData),
  getRecords: (params) => api.get('/renewable/records', { params }),
  getRecordById: (id) => api.get(`/renewable/records/${id}`),
  updateRecord: (id, recordData) => api.put(`/renewable/records/${id}`, recordData),
  deleteRecord: (id) => api.delete(`/renewable/records/${id}`),
  
  // Statistics
  getStatistics: (params) => api.get('/renewable/stats', { params }),
  getDashboard: () => api.get('/renewable/dashboard'),
  
  // Advanced Analytics
  getGenerationMeters: (params) => api.get('/renewable/meters', { params }),
  getPeakGeneration: (params) => api.get('/renewable/peak-detection', { params }),
  getProductionAlerts: (params) => api.get('/renewable/alerts', { params }),
  getEnergyIndependence: (params) => api.get('/renewable/independence', { params }),
  getOptimizationRecommendations: () => api.get('/renewable/recommendations'),
  
  // Report Generation
  generateRecordsPDF: (params) => {
    return api.get('/renewable/reports/pdf', {
      params,
      responseType: 'blob'
    });
  },
  generateRecordsCSV: (params) => {
    return api.get('/renewable/reports/csv', {
      params,
      responseType: 'blob'
    });
  },
  generateSourcesPDF: (params) => {
    return api.get('/renewable/reports/sources/pdf', {
      params,
      responseType: 'blob'
    });
  },
  generateSourcesCSV: (params) => {
    return api.get('/renewable/reports/sources/csv', {
      params,
      responseType: 'blob'
    });
  },
  generateSummaryPDF: (params) => {
    return api.get('/renewable/reports/summary/pdf', {
      params,
      responseType: 'blob'
    });
  }
};

export default api;
