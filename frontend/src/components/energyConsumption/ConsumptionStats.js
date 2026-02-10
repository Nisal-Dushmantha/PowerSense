import React, { useState, useEffect } from 'react';
import { getTotalConsumption } from '../../services/energyApi';

const ConsumptionStats = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalConsumption: 0,
    averageDaily: 0,
    peakConsumption: 0,
    data: [],
  });
  const [filters, setFilters] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    period: 'daily',
  });

  const fetchStats = async () => {
    if (!filters.startDate || !filters.endDate) return;

    setLoading(true);
    setError(null);
    try {
      const params = {
        startDate: filters.startDate,
        endDate: filters.endDate,
        period: filters.period,
      };

      const response = await getTotalConsumption(params);
      const data = response.data || [];
      
      // Calculate peak consumption
      const peakConsumption = data.length > 0 
        ? Math.max(...data.map(item => item.energy_used_kwh || 0))
        : 0;
      
      setStats({
        totalConsumption: response.total_consumption || 0,
        averageDaily: response.average_daily || 0,
        peakConsumption,
        data,
      });
    } catch (err) {
      setError('Failed to load consumption statistics');
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [filters]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const formatEnergy = (kwh) => {
    return `${parseFloat(kwh || 0).toFixed(2)} kWh`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loading-spinner w-12 h-12"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4">
        <div className="flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          <span>{error}</span>
        </div>
        <button 
          onClick={fetchStats}
          className="ml-4 text-red-600 hover:text-red-800 underline font-medium"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-textPrimary">Energy Consumption Statistics</h1>
        <p className="text-textSecondary mt-1">Monitor and analyze your energy usage patterns</p>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-textPrimary mb-2">Start Date</label>
            <input
              type="date"
              className="input-field"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-textPrimary mb-2">End Date</label>
            <input
              type="date"
              className="input-field"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-textPrimary mb-2">Period</label>
            <select 
              className="input-field"
              value={filters.period}
              onChange={(e) => handleFilterChange('period', e.target.value)}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="card card-gradient">
          <div className="card-body">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                <svg className="w-6 h-6 text-primary" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M13 2.05v3.03c3.39.49 6 3.39 6 6.92 0 .9-.18 1.75-.48 2.54l2.6 1.53c.56-1.24.88-2.62.88-4.07 0-5.18-3.95-9.45-9-9.95zM12 19c-3.87 0-7-3.13-7-7 0-3.53 2.61-6.43 6-6.92V2.05c-5.06.5-9 4.76-9 9.95 0 5.52 4.47 10 9.99 10 3.31 0 6.24-1.61 8.06-4.09l-2.6-1.53C16.17 17.98 14.21 19 12 19z"/>
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-textSecondary">Total Consumption</p>
                <p className="text-2xl font-bold text-textPrimary">{formatEnergy(stats.totalConsumption)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card card-gradient">
          <div className="card-body">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-secondary/10 rounded-2xl flex items-center justify-center">
                <svg className="w-6 h-6 text-secondary" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm6 12H6v-1.4c0-.9.68-1.6 1.5-1.6h9c.82 0 1.5.7 1.5 1.6V18z"/>
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-textSecondary">Average {filters.period === 'daily' ? 'Daily' : filters.period === 'weekly' ? 'Weekly' : 'Monthly'}</p>
                <p className="text-2xl font-bold text-textPrimary">{formatEnergy(stats.averageDaily)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card card-gradient">
          <div className="card-body">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center">
                <svg className="w-6 h-6 text-accent" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-textSecondary">Peak Consumption</p>
                <p className="text-2xl font-bold text-textPrimary">{formatEnergy(stats.peakConsumption)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Data Table */}
      {stats.data && stats.data.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-xl font-semibold text-textPrimary">Consumption Data</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th>Date</th>
                  <th>Consumption</th>
                  <th>Period Type</th>
                </tr>
              </thead>
              <tbody>
                {stats.data.map((item, index) => (
                  <tr key={index} className="table-row">
                    <td className="table-cell font-medium">
                      {new Date(item.consumption_date || item._id).toLocaleDateString()}
                    </td>
                    <td className="table-cell font-semibold">
                      {formatEnergy(item.energy_used_kwh || item.total_energy_used)}
                    </td>
                    <td className="table-cell">
                      <span className="badge badge-secondary">
                        {item.period_type || filters.period}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsumptionStats;
