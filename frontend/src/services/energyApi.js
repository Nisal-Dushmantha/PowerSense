import api from './api';

const ENERGY_URL = '/energy-consumption';

// Create new energy consumption record
export const createEnergyRecord = async (recordData) => {
  const response = await api.post(ENERGY_URL, recordData);
  return response.data;
};

// Get all energy consumption records
export const getEnergyRecords = async (params = {}) => {
  const response = await api.get(ENERGY_URL, { params });
  return response.data;
};

// Get total energy consumption
export const getTotalConsumption = async (params = {}) => {
  const response = await api.get(`${ENERGY_URL}/total`, { params });
  return response.data;
};

// Update energy consumption record
export const updateEnergyRecord = async (id, recordData) => {
  const response = await api.put(`${ENERGY_URL}/${id}`, recordData);
  return response.data;
};

// Delete energy consumption record
export const deleteEnergyRecord = async (id) => {
  const response = await api.delete(`${ENERGY_URL}/${id}`);
  return response.data;
};
