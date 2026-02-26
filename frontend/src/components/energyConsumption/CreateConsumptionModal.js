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

      if (formData.consumption_time) {
        submitData.consumption_time = formData.consumption_time.includes(':') && formData.consumption_time.split(':').length === 2
          ? formData.consumption_time + ':00'
          : formData.consumption_time;
      }

      const response = await createEnergyRecord(submitData);
      
      // Notify parent component about the new record
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
      title="Add New Energy Consumption Record"
      size="default"
    >
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl mb-6 fade-in">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            <span>{error}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Consumption Date */}
          <div>
            <label htmlFor="consumption_date" className="form-label">
              Date *
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

          {/* Consumption Time */}
          <div>
            <label htmlFor="consumption_time" className="form-label">
              Time (Optional)
            </label>
            <input
              type="time"
              id="consumption_time"
              name="consumption_time"
              value={formData.consumption_time}
              onChange={handleChange}
              className="input-field"
              placeholder="HH:MM"
            />
            <p className="form-help">Leave empty if not specific to a time</p>
          </div>

          {/* Energy Used */}
          <div>
            <label htmlFor="energy_used_kwh" className="form-label">
              Energy Used (kWh) *
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
                className="input-field pr-16"
                placeholder="0.00"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">kWh</span>
              </div>
            </div>
          </div>

          {/* Period Type */}
          <div>
            <label htmlFor="period_type" className="form-label">
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
              <option value="hourly">Hourly</option>
              <option value="daily">Daily</option>
              <option value="monthly">Monthly</option>
            </select>
            <p className="form-help">Choose the measurement period for this consumption data</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="btn-ghost"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary min-w-[140px]"
          >
            {loading ? (
              <div className="flex items-center">
                <div className="loading-spinner w-4 h-4 mr-2"></div>
                Creating...
              </div>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                </svg>
                Create Record
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateConsumptionModal;