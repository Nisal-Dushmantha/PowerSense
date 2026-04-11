import api from './api';

const unwrap = (response) => {
  if (response?.data?.data !== undefined) return response.data.data;
  return response.data;
};

export const getEnergyRecords = async (params = {}) => {
  const response = await api.get('/energy-consumption', { params });
  return { data: unwrap(response) || [] };
};

export const createEnergyRecord = async (payload) => {
  const response = await api.post('/energy-consumption', payload);
  return { data: unwrap(response) };
};

export const updateEnergyRecord = async (id, payload) => {
  const response = await api.put(`/energy-consumption/${id}`, payload);
  return { data: unwrap(response) };
};

export const deleteEnergyRecord = async (id) => api.delete(`/energy-consumption/${id}`);

export const getTotalConsumption = async (params = {}) => {
  const response = await api.get('/energy-consumption/total', { params });
  return unwrap(response) || { total_consumption: 0, average_daily: 0, data: [] };
};

export const getPeakUsage = async (params = {}) => {
  const response = await api.get('/energy-analytics/peak', { params });
  return { data: unwrap(response) };
};

export const getThresholdAlerts = async () => {
  const response = await api.get('/energy-analytics/alerts');
  return { data: unwrap(response) };
};

export const getCarbonFootprint = async (params = {}) => {
  const response = await api.get('/energy-analytics/carbon', { params });
  return { data: unwrap(response) };
};

export const getUsageComparison = async (params = {}) => {
  const response = await api.get('/energy-analytics/comparison', { params });
  return { data: unwrap(response) };
};

export const getRecommendations = async () => {
  const response = await api.get('/energy-analytics/recommendations');
  return { data: unwrap(response) };
};

export const updateEnergyThreshold = async (energyThreshold) => {
  const response = await api.put('/auth/threshold', { energyThreshold });
  return { data: unwrap(response) };
};

export const downloadMonthlyReport = async (month, year) => {
  const response = await api.get('/energy-analytics/report/pdf', {
    params: { month, year },
    responseType: 'blob'
  });

  const blob = new Blob([response.data], { type: 'application/pdf' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `energy-report-${year}-${String(month).padStart(2, '0')}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
};
