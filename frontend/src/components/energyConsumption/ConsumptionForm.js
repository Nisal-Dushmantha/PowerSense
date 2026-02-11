import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  createEnergyRecord, 
  updateEnergyRecord, 
  getEnergyRecords 
} from '../../services/energyApi';

const ConsumptionForm = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [formData, setFormData] = useState({
    consumption_date: '',
    consumption_time: '',
    energy_used_kwh: '',
    period_type: 'daily'
  });

  useEffect(() => {
    if (id) {
      setIsEditMode(true);
      fetchRecord(id);
    }
  }, [id]);

  const fetchRecord = async (recordId) => {
    setLoading(true);
    try {
      const response = await getEnergyRecords({ id: recordId });
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
      setLoading(false);
    }
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

      // Convert time from HH:MM to HH:MM:SS format if provided
      if (formData.consumption_time) {
        submitData.consumption_time = formData.consumption_time.includes(':') && formData.consumption_time.split(':').length === 2
          ? formData.consumption_time + ':00'
          : formData.consumption_time;
      }

      if (isEditMode) {
        await updateEnergyRecord(id, submitData);
      } else {
        await createEnergyRecord(submitData);
      }
      
      navigate('/consumption');
    } catch (err) {
      const errorMessage = isEditMode 
        ? 'Failed to update record' 
        : 'Failed to create record';
      setError(err.response?.data?.message || errorMessage);
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loading-spinner w-12 h-12"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card">
        <h1 className="text-3xl font-bold text-textPrimary mb-6">
          {isEditMode ? 'Edit Energy Consumption Record' : 'Add New Energy Consumption Record'}
        </h1>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="consumption_date" className="block text-sm font-medium text-textPrimary mb-2">
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

          <div>
            <label htmlFor="consumption_time" className="block text-sm font-medium text-textPrimary mb-2">
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
          </div>

          <div>
            <label htmlFor="energy_used_kwh" className="block text-sm font-medium text-textPrimary mb-2">
              Energy Used (kWh) *
            </label>
            <input
              type="number"
              id="energy_used_kwh"
              name="energy_used_kwh"
              value={formData.energy_used_kwh}
              onChange={handleChange}
              required
              step="0.01"
              min="0"
              className="input-field"
              placeholder="Enter energy consumption"
            />
          </div>

          <div>
            <label htmlFor="period_type" className="block text-sm font-medium text-textPrimary mb-2">
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
          </div>

          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => navigate('/consumption')}
              className="btn-secondary flex-1"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex-1"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  {isEditMode ? 'Updating...' : 'Creating...'}
                </span>
              ) : (
                isEditMode ? 'Update Record' : 'Create Record'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConsumptionForm;
