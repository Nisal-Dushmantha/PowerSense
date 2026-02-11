import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getEnergyRecords, deleteEnergyRecord } from '../../services/energyApi';
import CreateConsumptionModal from './CreateConsumptionModal';

const ConsumptionList = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    period_type: '',
    startDate: '',
    endDate: '',
    search: ''
  });

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const queryParams = {};
      
      if (filters.period_type) queryParams.period_type = filters.period_type;
      if (filters.startDate) queryParams.startDate = filters.startDate;
      if (filters.endDate) queryParams.endDate = filters.endDate;
      if (filters.search) queryParams.search = filters.search;

      const response = await getEnergyRecords(queryParams);
      setRecords(response.data || []);
      setError(null);
    } catch (err) {
      setError('Failed to fetch energy consumption records');
      console.error('Error fetching records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [filters]);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      try {
        await deleteEnergyRecord(id);
        setRecords(records.filter(record => record._id !== id));
      } catch (err) {
        setError('Failed to delete record');
        console.error('Error deleting record:', err);
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatEnergy = (kwh) => {
    return `${parseFloat(kwh).toFixed(2)} kWh`;
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleRecordCreated = (newRecord) => {
    setRecords(prevRecords => [newRecord, ...prevRecords]);
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
      <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl mb-4">
        <div className="flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          <span>{error}</span>
        </div>
        <button 
          onClick={fetchRecords}
          className="ml-4 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 underline font-medium"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-textPrimary dark:text-gray-100">Energy Consumption Records</h1>
          <p className="text-textSecondary dark:text-gray-300 mt-1">Track and manage your energy usage data</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="btn-primary flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
          </svg>
          Add New Record
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-textPrimary dark:text-gray-200 mb-2">Period Type</label>
            <select 
              className="input-field"
              value={filters.period_type}
              onChange={(e) => handleFilterChange('period_type', e.target.value)}
            >
              <option value="">All Types</option>
              <option value="hourly">Hourly</option>
              <option value="daily">Daily</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-textPrimary dark:text-gray-200 mb-2">Start Date</label>
            <input
              type="date"
              className="input-field"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-textPrimary dark:text-gray-200 mb-2">End Date</label>
            <input
              type="date"
              className="input-field"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-textPrimary dark:text-gray-200 mb-2">Search</label>
            <input
              type="text"
              className="input-field"
              placeholder="Search records..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>
        </div>
      </div>

      {records.length === 0 ? (
        <div className="text-center py-12">
          <div className="card card-gradient max-w-md mx-auto">
            <div className="card-body text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M13 2.05v3.03c3.39.49 6 3.39 6 6.92 0 .9-.18 1.75-.48 2.54l2.6 1.53c.56-1.24.88-2.62.88-4.07 0-5.18-3.95-9.45-9-9.95zM12 19c-3.87 0-7-3.13-7-7 0-3.53 2.61-6.43 6-6.92V2.05c-5.06.5-9 4.76-9 9.95 0 5.52 4.47 10 9.99 10 3.31 0 6.24-1.61 8.06-4.09l-2.6-1.53C16.17 17.98 14.21 19 12 19z"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-textPrimary dark:text-gray-100 mb-2">No consumption records found</h3>
              <p className="text-textSecondary dark:text-gray-300 mb-6">Start by adding your first energy consumption record</p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="btn-primary inline-flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                </svg>
                Add Your First Record
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="card overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Energy Usage</th>
                  <th>Period Type</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record._id} className="table-row">
                    <td className="table-cell font-medium text-textPrimary dark:text-gray-100">
                      {formatDate(record.consumption_date)}
                    </td>
                    <td className="table-cell text-textSecondary dark:text-gray-400">
                      {record.consumption_time || 'N/A'}
                    </td>
                    <td className="table-cell">
                      <span className="font-semibold text-textPrimary dark:text-gray-200">{formatEnergy(record.energy_used_kwh)}</span>
                    </td>
                    <td className="table-cell">
                      <span className={`badge ${
                        record.period_type === 'hourly' ? 'badge-success' : 
                        record.period_type === 'daily' ? 'badge-primary' : 
                        'badge-warning'
                      }`}>
                        {record.period_type}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center space-x-2">
                        <Link
                          to={`/consumption/edit/${record._id}`}
                          className="btn-ghost btn-sm text-secondary hover:text-primary dark:text-secondary dark:hover:text-primary-light"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                          </svg>
                        </Link>
                        <button
                          onClick={() => handleDelete(record._id)}
                          className="btn-ghost btn-sm text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-4 p-4">
            {records.map((record) => (
              <div key={record._id} className="card-hover p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-textPrimary dark:text-gray-100">{formatDate(record.consumption_date)}</h3>
                    <p className="text-sm text-textSecondary dark:text-gray-400">{record.consumption_time || 'N/A'}</p>
                  </div>
                  <span className={`badge ${
                    record.period_type === 'hourly' ? 'badge-success' : 
                    record.period_type === 'daily' ? 'badge-primary' : 
                    'badge-warning'
                  }`}>
                    {record.period_type}
                  </span>
                </div>
                
                <div className="mb-4">
                  <span className="text-textSecondary dark:text-gray-400 text-sm">Energy Usage</span>
                  <p className="font-semibold text-lg text-textPrimary dark:text-gray-200">{formatEnergy(record.energy_used_kwh)}</p>
                </div>

                <div className="flex justify-end space-x-2">
                  <Link
                    to={`/consumption/edit/${record._id}`}
                    className="btn-secondary btn-sm"
                  >
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                    </svg>
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(record._id)}
                    className="btn-danger btn-sm"
                  >
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                    </svg>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <CreateConsumptionModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onRecordCreated={handleRecordCreated}
      />
    </div>
  );
};

export default ConsumptionList;
