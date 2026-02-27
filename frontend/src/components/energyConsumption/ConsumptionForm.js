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
        <h1 className="text-3xl font-bold text-textPrimary dark:text-gray-100 mb-6">
          {isEditMode ? 'Edit Energy Consumption Record' : 'Add New Energy Consumption Record'}
        </h1>
        
        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl mb-6">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              <span>{error}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="consumption_date" className="block text-sm font-medium text-textPrimary dark:text-gray-200 mb-2">
              Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="consumption_date"
              name="consumption_date"
              value={formData.consumption_date}
              onChange={handleChange}
              required
              max={new Date().toISOString().split('T')[0]}
              className="input-field"
            />
          </div>

          <div>
            <label htmlFor="consumption_time" className="block text-sm font-medium text-textPrimary dark:text-gray-200 mb-2">
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
            <label htmlFor="energy_used_kwh" className="block text-sm font-medium text-textPrimary dark:text-gray-200 mb-2">
              Energy Used (kWh) <span className="text-red-500">*</span>
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
                placeholder="Enter energy consumption"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-textSecondary dark:text-gray-400 text-sm font-medium">kWh</span>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="period_type" className="block text-sm font-medium text-textPrimary dark:text-gray-200 mb-2">
              Period Type <span className="text-red-500">*</span>
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
              <option value="weekly">Weekly</option>
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
              className="bg-gradient-to-r from-primary to-secondary hover:from-primary-dark hover:to-secondary-dark text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex-1 min-w-[140px] flex items-center justify-center"
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
