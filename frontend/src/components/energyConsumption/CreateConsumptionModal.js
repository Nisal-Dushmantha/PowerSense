// Create Consumption Modal
// Captures and validates a new energy reading, then posts it to backend.
import React, { useState } from 'react';
import { createEnergyRecord } from '../../services/energyApi';
import Modal from '../common/Modal';

const CreateConsumptionModal = ({ isOpen, onClose, onRecordCreated }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    consumption_date: '',
    consumption_time: '',
    energy_used_kwh: '',
    period_type: 'daily'
  });

  const resetForm = () => {
    // Reset local state so each open starts with a clean form.
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'energy_used_kwh') {
      // Clamp: block empty-string pass-through of out-of-range values
      if (value !== '' && (parseFloat(value) < 0.01 || parseFloat(value) > 99999)) return;
    }
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEnergyKeyDown = (e) => {
    // Block minus, plus, e/E (scientific notation)
    if (['-', '+', 'e', 'E'].includes(e.key)) e.preventDefault();
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

      // Normalize browser HH:MM to backend HH:MM:SS requirement.
      if (formData.consumption_time) {
        submitData.consumption_time = formData.consumption_time.includes(':') && formData.consumption_time.split(':').length === 2
          ? formData.consumption_time + ':00'
          : formData.consumption_time;
      }

      const response = await createEnergyRecord(submitData);
      
      // Notify parent so list and summary widgets can update immediately.
      if (onRecordCreated) {
        onRecordCreated(response.data);
      }
      
      // Close modal and reset form
      handleClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create record');
      console.error('Error creating record:', err);
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
            <div className="w-12 h-12 bg-gradient-to-r from-primary to-secondary rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Add Energy Reading
            </h2>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Track your consumption patterns
            </p>
          </div>
          <div className="hidden md:flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-gray-500 dark:text-gray-400">Live</span>
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
            <div>
              <span className="text-sm font-medium">{error}</span>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Enhanced Date Input */}
          <div className="space-y-2">
            <label htmlFor="consumption_date" className="flex items-center form-label text-gray-800 dark:text-gray-200">
              <div className="w-7 h-7 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mr-2">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
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
                max={new Date().toISOString().split('T')[0]}
                className="input-field pl-10 py-2.5 text-sm transition-all duration-300 hover:shadow-md focus:shadow-lg border-2"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Enhanced Time Input */}
          <div className="space-y-2">
            <label htmlFor="consumption_time" className="flex items-center form-label text-gray-800 dark:text-gray-200">
              <div className="w-7 h-7 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center mr-2">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12.5,7V12.25L17,14.92L16.25,16.15L11,13V7H12.5Z"/>
                </svg>
              </div>
              <span className="font-semibold text-sm">Time (Optional)</span>
            </label>
            <div className="relative">
              <input
                type="time"
                id="consumption_time"
                name="consumption_time"
                value={formData.consumption_time}
                onChange={handleChange}
                className="input-field pl-10 py-2.5 text-sm transition-all duration-300 hover:shadow-md focus:shadow-lg border-2"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12.5,7V12.25L17,14.92L16.25,16.15L11,13V7H12.5Z"/>
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
                onKeyDown={handleEnergyKeyDown}
                required
                step="0.01"
                min="0.01"
                max="99999"
                className="input-field pl-10 pr-16 py-2.5 text-lg font-semibold transition-all duration-300 hover:shadow-md focus:shadow-lg border-2"
                placeholder="0.01 – 99999"
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
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Secure Processing</span>
              </div>
              <div className="hidden md:flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
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
                disabled={loading || !formData.consumption_date || !formData.energy_used_kwh}
                className="px-6 py-2 bg-gradient-to-r from-primary to-secondary hover:from-primary-dark hover:to-secondary-dark text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 min-w-[140px] text-sm"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                    <span>Processing...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Add Reading
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default CreateConsumptionModal;