import React, { useState, useEffect } from 'react';
import { updateEnergyRecord, getEnergyRecords } from '../../services/energyApi';
import Modal from '../common/Modal';

const EditConsumptionModal = ({ isOpen, onClose, onRecordUpdated, recordId }) => {
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    consumption_date: '',
    consumption_time: '',
    energy_used_kwh: '',
    period_type: 'daily'
  });

  const resetForm = () => {
    setFormData({
      consumption_date: '',
      consumption_time: '',
      energy_used_kwh: '',
      period_type: 'daily'
    });
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const fetchRecord = async (id) => {
    if (!id) return;
    
    setFetchLoading(true);
    try {
      const response = await getEnergyRecords({ id });
      if (response.data && response.data.length > 0) {
        const record = response.data[0];
        setFormData({
          consumption_date: record.consumption_date ? record.consumption_date.split('T')[0] : '',
          consumption_time: record.consumption_time || '',
          energy_used_kwh: record.energy_used_kwh || '',
          period_type: record.period_type || 'daily'
        });
      }
      setError(null);
    } catch (err) {
      setError('Failed to fetch record details');
      console.error('Error fetching record:', err);
    } finally {
      setFetchLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && recordId) {
      fetchRecord(recordId);
    } else if (!isOpen) {
      resetForm();
    }
  }, [isOpen, recordId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const submitData = {
        ...formData,
        energy_used_kwh: parseFloat(formData.energy_used_kwh)
      };

      // Convert time from HH:MM to HH:MM:SS format if provided
      if (formData.consumption_time) {
        submitData.consumption_time = formData.consumption_time.includes(':') && formData.consumption_time.split(':').length === 2
          ? formData.consumption_time + ':00'
          : formData.consumption_time;
      }

      const response = await updateEnergyRecord(recordId, submitData);
      
      // Notify parent component about the updated record
      if (onRecordUpdated) {
        onRecordUpdated(response.data);
      }
      
      // Close modal and reset form
      handleClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update record');
      console.error('Error updating record:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title=""
      size="default"
    >
      {/* Professional Header */}
      <div className="relative mb-6 -mt-4 -mx-6 px-6 py-5 bg-gradient-to-r from-primary/5 via-secondary/10 to-accent/5 rounded-t-2xl border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Edit Energy Record
            </h2>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Update consumption data
            </p>
          </div>
          <div className="hidden md:flex items-center space-x-2">
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-gray-500 dark:text-gray-400">Edit Mode</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl mb-4 shadow-sm">
          <div className="flex items-center">
            <div className="flex-shrink-0 mr-3">
              <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
            </div>
            <span className="font-medium">{error}</span>
          </div>
        </div>
      )}

      {fetchLoading ? (
        <div className="flex flex-col justify-center items-center py-12">
          <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl flex items-center justify-center mb-4 animate-pulse">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">Loading record data...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Date Field */}
            <div className="space-y-2">
              <label htmlFor="consumption_date" className="flex items-center form-label text-gray-800 dark:text-gray-200">
                <div className="w-7 h-7 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center mr-2">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 3h-1V1h-2v2H8V1H6v2H5C3.89 3 3.01 3.89 3.01 5L3 19C3 20.1 3.89 21 5 21h14C20.1 21 21 20.1 21 19V5C21 3.89 20.1 3 19 3zM19 19H5V8h14v11zM7 10h5v5H7z"/>
                  </svg>
                </div>
                <span className="font-semibold text-sm">Date <span className="text-red-500">*</span></span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  id="consumption_date"
                  name="consumption_date"
                  value={formData.consumption_date}
                  onChange={handleChange}
                  required
                  className="input-field pl-10 py-2.5 transition-all duration-300 hover:shadow-md focus:shadow-lg border-2"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 3h-1V1h-2v2H8V1H6v2H5C3.89 3 3.01 3.89 3.01 5L3 19C3 20.1 3.89 21 5 21h14C20.1 21 21 20.1 21 19V5C21 3.89 20.1 3 19 3zM19 19H5V8h14v11zM7 10h5v5H7z"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* Time Field */}
            <div className="space-y-2">
              <label htmlFor="consumption_time" className="flex items-center form-label text-gray-800 dark:text-gray-200">
                <div className="w-7 h-7 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mr-2">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M16.2,16.2L11,13V7H12.5V12.2L17,14.9L16.2,16.2Z"/>
                  </svg>
                </div>
                <span className="font-semibold text-sm">Time</span>
              </label>
              <div className="relative">
                <input
                  type="time"
                  id="consumption_time"
                  name="consumption_time"
                  value={formData.consumption_time}
                  onChange={handleChange}
                  className="input-field pl-10 py-2.5 transition-all duration-300 hover:shadow-md focus:shadow-lg border-2"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M16.2,16.2L11,13V7H12.5V12.2L17,14.9L16.2,16.2Z"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* Enhanced Energy Input - Full Width */}
            <div className="md:col-span-2 space-y-2">
              <label htmlFor="energy_used_kwh" className="flex items-center form-label text-gray-800 dark:text-gray-200">
                <div className="w-7 h-7 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center mr-2">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                  </svg>
                </div>
                <span className="font-semibold text-sm">Energy Consumption <span className="text-red-500">*</span></span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="energy_used_kwh"
                  name="energy_used_kwh"
                  value={formData.energy_used_kwh}
                  onChange={handleChange}
                  required
                  step="0.01"
                  min="0"
                  className="input-field pl-10 pr-16 py-2.5 text-lg font-semibold transition-all duration-300 hover:shadow-md focus:shadow-lg border-2"
                  placeholder="Enter value"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                  </svg>
                </div>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <div className="bg-gradient-to-r from-primary to-secondary text-white px-2 py-1 rounded-lg text-xs font-bold shadow-sm">
                    kWh
                  </div>
                </div>
              </div>
            </div>

            {/* Compact Period Selection */}
            <div className="md:col-span-2 space-y-3">
              <label className="flex items-center form-label text-gray-800 dark:text-gray-200">
                <div className="w-7 h-7 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mr-2">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L2 7L12 12L22 7L12 2M2 17L12 22L22 17M2 12L12 17L22 12"/>
                  </svg>
                </div>
                <span className="font-semibold text-sm">Period <span className="text-red-500">*</span></span>
              </label>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { value: 'hourly', label: 'Hourly', icon: '⚡', desc: 'Real-time', color: 'blue' },
                  { value: 'daily', label: 'Daily', icon: '📊', desc: 'Most used', color: 'green' },
                  { value: 'weekly', label: 'Weekly', icon: '📅', desc: 'Week view', color: 'indigo' },
                  { value: 'monthly', label: 'Monthly', icon: '📈', desc: 'Overview', color: 'purple' }
                ].map((option) => (
                  <label
                    key={option.value}
                    className={`relative cursor-pointer group transition-all duration-300 ${
                      formData.period_type === option.value
                        ? 'transform scale-105'
                        : 'hover:scale-102'
                    }`}
                  >
                    <div className={`card-hover p-3 text-center border-2 rounded-xl transition-all duration-300 ${
                      formData.period_type === option.value
                        ? `border-${option.color}-500 shadow-md bg-gradient-to-br from-${option.color}-50 to-${option.color}-100 dark:from-${option.color}-900/20 dark:to-${option.color}-800/20`
                        : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800'
                    }`}>
                      <input
                        type="radio"
                        name="period_type"
                        value={option.value}
                        checked={formData.period_type === option.value}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <div className="text-xl mb-1">{option.icon}</div>
                      <h3 className={`font-bold text-sm mb-1 ${
                        formData.period_type === option.value
                          ? `text-${option.color}-600 dark:text-${option.color}-400`
                          : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        {option.label}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {option.desc}
                      </p>
                      {formData.period_type === option.value && (
                        <div className="absolute top-2 right-2">
                          <div className={`w-4 h-4 bg-${option.color}-500 rounded-full flex items-center justify-center shadow-lg`}>
                            <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Compact Action Section */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-col md:flex-row items-center justify-between space-y-3 md:space-y-0">
              {/* Info section */}
              <div className="flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                  <span>Edit Mode Active</span>
                </div>
                <div className="hidden md:flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Auto-saved</span>
                </div>
              </div>
              
              {/* Action buttons */}
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                  className="px-4 py-2 text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg font-medium transition-all duration-300 hover:scale-105 active:scale-95 border border-gray-200 dark:border-gray-600 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || fetchLoading}
                  className="px-6 py-2 bg-gradient-to-r from-primary to-secondary hover:from-primary-dark hover:to-secondary-dark text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 min-w-[140px] text-sm"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                      <span>Updating...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      Update Record
                    </div>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default EditConsumptionModal;