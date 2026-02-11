import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getEnergyRecords, deleteEnergyRecord, createEnergyRecord } from '../../services/energyApi';

const ConsumptionList = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const [filters, setFilters] = useState({
    period_type: '',
    startDate: '',
    endDate: '',
    search: ''
  });
  const [formData, setFormData] = useState({
    consumption_date: '',
    consumption_time: '',
    energy_used_kwh: '',
    period_type: 'daily'
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

  const handleOpenModal = () => {
    setShowModal(true);
    setFormData({
      consumption_date: '',
      consumption_time: '',
      energy_used_kwh: '',
      period_type: 'daily'
    });
    setFormError(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({
      consumption_date: '',
      consumption_time: '',
      energy_used_kwh: '',
      period_type: 'daily'
    });
    setFormError(null);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);

    try {
      const submitData = {
        ...formData,
        energy_used_kwh: parseFloat(formData.energy_used_kwh)
      };

      if (formData.consumption_time) {
        submitData.consumption_time = formData.consumption_time.includes(':') && formData.consumption_time.split(':').length === 2
          ? formData.consumption_time + ':00'
          : formData.consumption_time;
      }

      await createEnergyRecord(submitData);
      handleCloseModal();
      fetchRecords(); // Refresh the list
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create record');
      console.error('Error creating record:', err);
    } finally {
      setFormLoading(false);
    }
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
          onClick={fetchRecords}
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-textPrimary">Energy Consumption Records</h1>
          <p className="text-textSecondary mt-1">Track and manage your energy usage data</p>
        </div>
        <button
          onClick={handleOpenModal}
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
            <label className="block text-sm font-medium text-textPrimary mb-2">Period Type</label>
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
            <label className="block text-sm font-medium text-textPrimary mb-2">Search</label>
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
              <h3 className="text-xl font-semibold text-textPrimary mb-2">No consumption records found</h3>
              <p className="text-textSecondary mb-6">Start by adding your first energy consumption record</p>
              <button
                onClick={handleOpenModal}
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
                    <td className="table-cell font-medium text-textPrimary">
                      {formatDate(record.consumption_date)}
                    </td>
                    <td className="table-cell">
                      {record.consumption_time || 'N/A'}
                    </td>
                    <td className="table-cell font-semibold">
                      {formatEnergy(record.energy_used_kwh)}
                    </td>
                    <td className="table-cell">
                      <span className="badge badge-secondary">
                        {record.period_type}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center space-x-2">
                        <Link
                          to={`/consumption/edit/${record._id}`}
                          className="btn-ghost btn-sm text-secondary hover:text-primary"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                          </svg>
                        </Link>
                        <button
                          onClick={() => handleDelete(record._id)}
                          className="btn-ghost btn-sm text-red-500 hover:text-red-700"
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
                    <h3 className="font-semibold text-textPrimary">{formatDate(record.consumption_date)}</h3>
                    <p className="text-sm text-textSecondary">{record.consumption_time || 'N/A'}</p>
                  </div>
                  <span className="badge badge-secondary">
                    {record.period_type}
                  </span>
                </div>
                
                <div className="mb-4">
                  <span className="text-textSecondary text-sm">Energy Usage</span>
                  <p className="font-semibold text-lg">{formatEnergy(record.energy_used_kwh)}</p>
                </div>

                <div className="flex justify-end space-x-2">
                  <Link
                    to={`/consumption/edit/${record._id}`}
                    className="btn-secondary btn-sm"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(record._id)}
                    className="btn-danger btn-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Professional Modal Form */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white rounded-t-2xl border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-textPrimary">Add New Record</h2>
              <button
                onClick={handleCloseModal}
                className="btn-ghost p-2 rounded-full"
              >
                <svg className="w-5 h-5 text-textSecondary" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-6">
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                    <span>{formError}</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div>
                  <label htmlFor="modal_consumption_date" className="block text-sm font-medium text-textPrimary mb-2">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="modal_consumption_date"
                    name="consumption_date"
                    value={formData.consumption_date}
                    onChange={handleFormChange}
                    required
                    className="input-field"
                  />
                </div>

                <div>
                  <label htmlFor="modal_consumption_time" className="block text-sm font-medium text-textPrimary mb-2">
                    Time (Optional)
                  </label>
                  <input
                    type="time"
                    id="modal_consumption_time"
                    name="consumption_time"
                    value={formData.consumption_time}
                    onChange={handleFormChange}
                    className="input-field"
                  />
                </div>

                <div>
                  <label htmlFor="modal_energy_used_kwh" className="block text-sm font-medium text-textPrimary mb-2">
                    Energy Used (kWh) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      id="modal_energy_used_kwh"
                      name="energy_used_kwh"
                      value={formData.energy_used_kwh}
                      onChange={handleFormChange}
                      required
                      step="0.01"
                      min="0"
                      className="input-field pr-12"
                      placeholder="0.00"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-textSecondary text-sm font-medium">kWh</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="modal_period_type" className="block text-sm font-medium text-textPrimary mb-2">
                    Period Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="modal_period_type"
                    name="period_type"
                    value={formData.period_type}
                    onChange={handleFormChange}
                    required
                    className="input-field"
                  >
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>

                {/* Modal Actions */}
                <div className="flex space-x-3 pt-6">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    disabled={formLoading}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="btn-primary flex-1 flex items-center justify-center"
                  >
                    {formLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Creating...
                      </>
                    ) : (
                      <>Create Record</>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsumptionList;
