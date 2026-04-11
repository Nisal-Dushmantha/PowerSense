import api from './api';

const ENERGY_URL    = '/energy-consumption';
const ANALYTICS_URL = '/energy-analytics';

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

export const getConsumptionSummary = async () => {
  const response = await api.get(`${ENERGY_URL}/summary`);
  return response.data;
};

export const getConsumptionIntegration = async () => {
  const response = await api.get(`${ENERGY_URL}/integration`);
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

// ── Analytics API ──────────────────────────────────────────

export const getPeakUsage = async (params = {}) => {
  const response = await api.get(`${ANALYTICS_URL}/peak`, { params });
  return response.data;
};

export const getThresholdAlerts = async () => {
  const response = await api.get(`${ANALYTICS_URL}/alerts`);
  return response.data;
};

export const getCarbonFootprint = async (params = {}) => {
  const response = await api.get(`${ANALYTICS_URL}/carbon`, { params });
  return response.data;
};

export const getUsageComparison = async (params = {}) => {
  const response = await api.get(`${ANALYTICS_URL}/comparison`, { params });
  return response.data;
};

export const getRecommendations = async () => {
  const response = await api.get(`${ANALYTICS_URL}/recommendations`);
  return response.data;
};

export const updateEnergyThreshold = async (energyThreshold) => {
  const response = await api.put('/auth/threshold', { energyThreshold });
  return response.data;
};

export const downloadMonthlyReport = async (month, year) => {
  const response = await api.get(`${ANALYTICS_URL}/report/pdf`, {
    params: { month, year },
    responseType: 'blob'
  });
  const url  = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
  const link = document.createElement('a');
  link.href  = url;
  link.setAttribute('download', `PowerSense_Report_${month}_${year}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
