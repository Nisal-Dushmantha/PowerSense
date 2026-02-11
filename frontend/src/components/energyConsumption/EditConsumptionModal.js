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
      title="Edit Energy Consumption Record"
      size="default"
    >
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl mb-6 fade-in">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            <span>{error}</span>
          </div>
        </div>
      )}

      {fetchLoading ? (
        <div className="flex justify-center items-center py-8">
          <div className="loading-spinner w-8 h-8"></div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Date Field */}
          <div>
            <label htmlFor="consumption_date" className="block text-sm font-medium text-textPrimary dark:text-gray-200 mb-2">
              Consumption Date *
            </label>
            <input
              type="date"
              id="consumption_date"
              name="consumption_date"
              value={formData.consumption_date}
              onChange={handleChange}
              required
              className="input-field"
            />
          </div>

          {/* Time Field */}
          <div>
            <label htmlFor="consumption_time" className="block text-sm font-medium text-textPrimary dark:text-gray-200 mb-2">
              Consumption Time
            </label>
            <input
              type="time"
              id="consumption_time"
              name="consumption_time"
              value={formData.consumption_time}
              onChange={handleChange}
              className="input-field"
            />
          </div>

          {/* Energy Usage Field */}
          <div>
            <label htmlFor="energy_used_kwh" className="block text-sm font-medium text-textPrimary dark:text-gray-200 mb-2">
              Energy Used (kWh) *
            </label>
            <input
              type="number"
              id="energy_used_kwh"
              name="energy_used_kwh"
              value={formData.energy_used_kwh}
              onChange={handleChange}
              step="0.01"
              min="0"
              required
              className="input-field"
              placeholder="0.00"
            />
          </div>

          {/* Period Type Field */}
          <div>
            <label htmlFor="period_type" className="block text-sm font-medium text-textPrimary dark:text-gray-200 mb-2">
              Period Type *
            </label>
            <select
              id="period_type"
              name="period_type"
              value={formData.period_type}
              onChange={handleChange}
              required
              className="input-field"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="hourly">Hourly</option>
            </select>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-surface dark:border-gray-700">
            <button
              type="button"
              onClick={handleClose}
              className="btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading || fetchLoading}
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="loading-spinner w-4 h-4 mr-2"></div>
                  Updating...
                </div>
              ) : (
                'Update Record'
              )}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default EditConsumptionModal;