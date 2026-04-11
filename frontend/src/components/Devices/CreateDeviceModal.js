import React, { useState } from 'react';
import Modal from '../common/Modal';
import { deviceService } from '../../services/api';

const initialFormData = {
  deviceId: '',
  name: '',
  type: '',
  powerRating: '',
  expectedDailyUsage: ''
};

const CreateDeviceModal = ({ isOpen, onClose, onDeviceCreated }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState(initialFormData);

  const handleClose = () => {
    if (loading) return;
    setError(null);
    setFormData(initialFormData);
    onClose();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        ...formData,
        powerRating: parseFloat(formData.powerRating),
        expectedDailyUsage: parseFloat(formData.expectedDailyUsage)
      };

      await deviceService.createDevice(payload);
      setFormData(initialFormData);
      if (onDeviceCreated) onDeviceCreated();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create device');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add New Device" size="default">
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Device ID (optional)</label>
          <input
            name="deviceId"
            value={formData.deviceId}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            placeholder="Leave empty to auto-generate"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Device Name *</label>
          <input
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Device Type *</label>
          <input
            name="type"
            value={formData.type}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Power Rating (W) *</label>
          <input
            name="powerRating"
            value={formData.powerRating}
            onChange={handleChange}
            required
            type="number"
            min="0"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Expected Daily Usage (hours) *</label>
          <input
            name="expectedDailyUsage"
            value={formData.expectedDailyUsage}
            onChange={handleChange}
            required
            type="number"
            min="0"
            step="0.1"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={handleClose} className="btn-ghost" disabled={loading}>
            Cancel
          </button>
          <button type="submit" disabled={loading} className="btn-primary min-w-[120px]">
            {loading ? 'Saving...' : 'Create Device'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateDeviceModal;
