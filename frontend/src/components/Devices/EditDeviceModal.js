import React, { useEffect, useState } from 'react';
import Modal from '../common/Modal';
import { deviceService } from '../../services/api';

const EditDeviceModal = ({ isOpen, onClose, deviceId, onDeviceUpdated }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    deviceId: '',
    name: '',
    type: '',
    powerRating: '',
    expectedDailyUsage: ''
  });

  useEffect(() => {
    if (deviceId && isOpen) {
      fetchDevice();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId, isOpen]);

  const fetchDevice = async () => {
    try {
      setLoading(true);
      const res = await deviceService.getDeviceById(deviceId);
      const device = res.data.data || res.data;
      setFormData({
        deviceId: device.deviceId || device._id,
        name: device.name || '',
        type: device.type || '',
        powerRating: device.powerRating || '',
        expectedDailyUsage: device.expectedDailyUsage || ''
      });
      setError(null);
    } catch (err) {
      setError('Failed to load device');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const submitData = {
        name: formData.name,
        type: formData.type,
        powerRating: parseFloat(formData.powerRating),
        expectedDailyUsage: parseFloat(formData.expectedDailyUsage)
      };
      await deviceService.updateDevice(deviceId, submitData);
      if (onDeviceUpdated) onDeviceUpdated();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update device');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Device"
      size="default"
    >
      {loading ? (
        <div className="flex justify-center items-center h-48">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl mb-4">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Device ID</label>
            <input name="deviceId" value={formData.deviceId} disabled className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Device Name *</label>
            <input name="name" value={formData.name} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Device Type *</label>
            <input name="type" value={formData.type} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Power Rating (W) *</label>
            <input name="powerRating" value={formData.powerRating} onChange={handleChange} required type="number" min="0" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Expected Daily Usage (hours) *</label>
            <input name="expectedDailyUsage" value={formData.expectedDailyUsage} onChange={handleChange} required type="number" min="0" step="0.1" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
          </div>
          <div className="flex justify-end space-x-4">
            <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary min-w-[120px]">{saving ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default EditDeviceModal;
