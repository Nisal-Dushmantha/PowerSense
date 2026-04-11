import React, { useState } from 'react';
import Modal from '../common/Modal';
import { deviceService } from '../../services/api';

const CreateDeviceModal = ({ isOpen, onClose, onDeviceCreated }) => {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    deviceId: '',
    name: '',
    type: '',
    powerRating: '',
    expectedDailyUsage: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

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
    if (saving) return;
    resetForm();
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const submitData = {
        ...formData,
        powerRating: parseFloat(formData.powerRating),
        expectedDailyUsage: parseFloat(formData.expectedDailyUsage)
      };

      await deviceService.createDevice(submitData);

      if (onDeviceCreated) {
        onDeviceCreated();
      }

      handleClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create device');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add New Device"
      size="default"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl mb-4">
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

        <div className="flex justify-end space-x-4">
          <button type="button" onClick={handleClose} className="btn-ghost" disabled={saving}>
            Cancel
          </button>
          <button type="submit" disabled={saving} className="btn-primary min-w-[120px]">
            {saving ? 'Saving...' : 'Create Device'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateDeviceModal;
