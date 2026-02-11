import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { deviceService } from '../../services/api';

const CreateDevice = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
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
      await deviceService.createDevice(submitData);
      navigate('/devices');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create device');
      console.error('Error creating device:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white shadow-lg rounded-lg p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Add New Device</h1>

        {error && (
          <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Device ID (optional)</label>
            <input
              name="deviceId"
              value={formData.deviceId}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Leave empty to auto-generate"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Device Name *</label>
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Device Type *</label>
            <input
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Power Rating (W) *</label>
            <input
              name="powerRating"
              value={formData.powerRating}
              onChange={handleChange}
              required
              type="number"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Expected Daily Usage (hours) *</label>
            <input
              name="expectedDailyUsage"
              value={formData.expectedDailyUsage}
              onChange={handleChange}
              required
              type="number"
              min="0"
              step="0.1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/devices')}
              className="px-4 py-2 border border-gray-300 rounded-md bg-white text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Create Device'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateDevice;
