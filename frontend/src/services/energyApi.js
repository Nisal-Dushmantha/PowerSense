import axios from 'axios';

const API_URL = 'http://localhost:5000/api/energy-consumption';

// Create new energy consumption record
export const createEnergyRecord = async (recordData) => {
  const response = await axios.post(API_URL, recordData);
  return response.data;
};

// Get all energy consumption records
export const getEnergyRecords = async (params = {}) => {
  const response = await axios.get(API_URL, { params });
  return response.data;
};

// Get total energy consumption
export const getTotalConsumption = async (householdId) => {
  const response = await axios.get(`${API_URL}/total`, {
    params: { household_id: householdId }
  });
  return response.data;
};

// Update energy consumption record
export const updateEnergyRecord = async (id, recordData) => {
  const response = await axios.put(`${API_URL}/${id}`, recordData);
  return response.data;
};

// Delete energy consumption record
export const deleteEnergyRecord = async (id) => {
  const response = await axios.delete(`${API_URL}/${id}`);
  return response.data;
};
