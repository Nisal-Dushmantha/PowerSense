import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { deviceService } from '../../services/api';

const EditDevice = () => {
  const { id } = useParams();
  const navigate = useNavigate();
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
    fetchDevice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchDevice = async () => {
    try {
      setLoading(true);
      const res = await deviceService.getDeviceById(id);
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
      console.error('Error fetching device', err);
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
      await deviceService.updateDevice(id, submitData);
      navigate('/devices');
    } catch (err) {
      console.error('Error updating device', err);
      setError(err.response?.data?.message || 'Failed to update device');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-48"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white shadow-lg rounded-lg p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Edit Device</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Device ID</label>
            <input name="deviceId" value={formData.deviceId} disabled className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Device Name *</label>
            <input name="name" value={formData.name} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Device Type *</label>
            <input name="type" value={formData.type} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Power Rating (W) *</label>
            <input name="powerRating" value={formData.powerRating} onChange={handleChange} required type="number" min="0" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Expected Daily Usage (hours) *</label>
            <input name="expectedDailyUsage" value={formData.expectedDailyUsage} onChange={handleChange} required type="number" min="0" step="0.1" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>

          <div className="flex justify-end space-x-4">
            <button type="button" onClick={() => navigate('/devices')} className="px-4 py-2 border border-gray-300 rounded-md bg-white text-sm">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50">{saving ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditDevice;
