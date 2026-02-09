import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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
  deleteBill: (id) => api.delete(`/bills/${id}`),
  
  // Get statistics
  getStats: () => api.get('/bills/stats'),
};

export default api;
