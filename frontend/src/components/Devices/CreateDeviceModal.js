import React, { useState } from 'react';
import { deviceService } from '../../services/api';
import Modal from '../common/Modal';

const CreateDeviceModal = ({ isOpen, onClose, onDeviceCreated }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    deviceId: '',
    name: '',
    type: '',
    powerRating: '',
    expectedDailyUsage: ''
  });

  const resetForm = () => {
    setFormData({
      deviceId: '',
      name: '',
      type: '',
      powerRating: '',
      expectedDailyUsage: ''
    });
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const submitData = {
        ...formData,
        powerRating: parseFloat(formData.powerRating),
        expectedDailyUsage: parseFloat(formData.expectedDailyUsage)
      };
      const response = await deviceService.createDevice(submitData);
      if (onDeviceCreated) {
        onDeviceCreated(response.data.data);
      }
      handleClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create device');
      console.error('Error creating device:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add New Device"
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
          <div className="md:col-span-2">
            <label htmlFor="deviceId" className="form-label">
              Device ID (optional)
            </label>
            <input
              type="text"
              id="deviceId"
              name="deviceId"
              value={formData.deviceId}
              onChange={handleChange}
              className="input-field"
              placeholder="Leave empty to auto-generate"
            />
          </div>
          <div>
            <label htmlFor="name" className="form-label">
              Device Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="input-field"
              placeholder="Enter device name"
            />
          </div>
          <div>
            <label htmlFor="type" className="form-label">
              Device Type *
            </label>
            <input
              type="text"
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
              className="input-field"
              placeholder="Enter device type"
            />
          </div>
          <div>
            <label htmlFor="powerRating" className="form-label">
              Power Rating (W) *
            </label>
            <input
              type="number"
              id="powerRating"
              name="powerRating"
              value={formData.powerRating}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
              className="input-field"
              placeholder="0.00"
            />
          </div>
          <div>
            <label htmlFor="expectedDailyUsage" className="form-label">
              Expected Daily Usage (hours) *
            </label>
            <input
              type="number"
              id="expectedDailyUsage"
              name="expectedDailyUsage"
              value={formData.expectedDailyUsage}
              onChange={handleChange}
              required
              min="0"
              step="0.1"
              className="input-field"
              placeholder="0.0"
            />
          </div>
        </div>
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
            className="btn-primary min-w-[120px]"
          >
            {loading ? (
              <div className="flex items-center">
                <div className="loading-spinner w-4 h-4 mr-2"></div>
                Saving...
              </div>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                </svg>
                Add Device
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateDeviceModal;
