import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { renewableService } from '../../services/api';

const RenewableEnergyForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [sources, setSources] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedSource, setSelectedSource] = useState('');
  const [editingRecord, setEditingRecord] = useState(null);

  const weatherOptions = ['Sunny', 'Cloudy', 'Rainy', 'Windy', 'Stormy', 'Foggy', 'Mixed', 'Other'];

  const initialFormState = {
    source: '',
    recordDate: new Date().toISOString().split('T')[0],
    energyGenerated: '',
    energyUnit: 'kWh',
    peakPower: '',
    averagePower: '',
    operatingHours: '',
    efficiency: '',
    weatherCondition: 'Sunny',
    temperature: '',
    costSavings: '',
    notes: '',
    maintenancePerformed: false,
    issues: ''
  };

  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    fetchSources();
    fetchRecords();
    
    // Check if source ID is in URL params
    const sourceParam = searchParams.get('source');
    if (sourceParam) {
      setSelectedSource(sourceParam);
      setFormData(prev => ({ ...prev, source: sourceParam }));
    }
  }, [searchParams]);

  const fetchSources = async () => {
    try {
      const response = await renewableService.getSources({ status: 'Active' });
      setSources(response.data.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch renewable sources');
      console.error('Error fetching sources:', err);
      setLoading(false);
    }
  };

  const fetchRecords = async () => {
    try {
      const params = {};
      const sourceParam = searchParams.get('source');
      if (sourceParam) params.source = sourceParam;
      
      const response = await renewableService.getRecords(params);
      setRecords(response.data.data);
    } catch (err) {
      console.error('Error fetching records:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validate
    if (!formData.source) {
      setError('Please select a renewable source');
      return;
    }

    try {
      if (editingRecord) {
        await renewableService.updateRecord(editingRecord._id, formData);
        setSuccess('Energy record updated successfully!');
      } else {
        await renewableService.createRecord(formData);
        setSuccess('Energy record created successfully!');
      }
      
      setFormData(initialFormState);
      setEditingRecord(null);
      fetchRecords();
      
      // Scroll to top to show success message
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save energy record');
      console.error('Error saving record:', err);
    }
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    setFormData({
      source: record.source._id || record.source,
      recordDate: record.recordDate ? record.recordDate.split('T')[0] : '',
      energyGenerated: record.energyGenerated,
      energyUnit: record.energyUnit,
      peakPower: record.peakPower || '',
      averagePower: record.averagePower || '',
      operatingHours: record.operatingHours || '',
      efficiency: record.efficiency || '',
      weatherCondition: record.weatherCondition || 'Sunny',
      temperature: record.temperature || '',
      costSavings: record.costSavings || '',
      notes: record.notes || '',
      maintenancePerformed: record.maintenancePerformed || false,
      issues: record.issues || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this energy record?')) {
      try {
        await renewableService.deleteRecord(id);
        setRecords(records.filter(record => record._id !== id));
        setSuccess('Energy record deleted successfully!');
      } catch (err) {
        setError('Failed to delete record');
        console.error('Error deleting record:', err);
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingRecord(null);
    setFormData(initialFormState);
  };

  const getSourceTypeIcon = (type) => {
    const icons = {
      Solar: '☀️',
      Wind: '🌪️',
      Hydro: '💧',
      Biomass: '🌿',
      Geothermal: '🌋',
      Other: '⚡'
    };
    return icons[type] || '⚡';
  };

  const getWeatherIcon = (weather) => {
    const icons = {
      Sunny: '☀️',
      Cloudy: '☁️',
      Rainy: '🌧️',
      Windy: '💨',
      Stormy: '⛈️',
      Foggy: '🌫️',
      Mixed: '⛅',
      Other: '🌤️'
    };
    return icons[weather] || '🌤️';
  };

  const formatNumber = (num) => {
    if (!num) return '0';
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(num);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-green-600"></div>
      </div>
    );
  }

  if (sources.length === 0) {
    return (
      <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl shadow-lg p-12 text-center border-2 border-dashed border-orange-300">
        <div className="text-8xl mb-4">⚠️</div>
        <h3 className="text-2xl font-bold text-gray-800 mb-2">No Active Renewable Sources</h3>
        <p className="text-gray-600 mb-6">You need to add at least one active renewable energy source before recording energy data.</p>
        <button
          onClick={() => navigate('/renewable/sources')}
          className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg transition-all shadow-lg"
        >
          Go to Sources
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 flex items-center">
            <span className="text-5xl mr-3">📊</span>
            {editingRecord ? 'Edit Energy Record' : 'Record Energy Production'}
          </h1>
          <p className="text-gray-600 mt-2">Track daily energy generation and performance</p>
        </div>
        <button
          onClick={() => navigate('/renewable')}
          className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg transition-all"
        >
          ← Back to Dashboard
        </button>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-6 py-4 rounded-lg flex items-center">
          <span className="text-2xl mr-3">✅</span>
          <p className="font-semibold">{success}</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg flex items-center">
          <span className="text-2xl mr-3">⚠️</span>
          <p className="font-semibold">{error}</p>
        </div>
      )}

      {/* Form */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">📝 Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Renewable Source <span className="text-red-500">*</span>
                </label>
                <select
                  name="source"
                  value={formData.source}
                  onChange={handleInputChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Select a source...</option>
                  {sources.map(source => (
                    <option key={source._id} value={source._id}>
                      {getSourceTypeIcon(source.sourceType)} {source.sourceName} ({source.capacity} {source.capacityUnit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Record Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="recordDate"
                  value={formData.recordDate}
                  onChange={handleInputChange}
                  required
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Energy Production */}
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">⚡ Energy Production</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Energy Generated <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    name="energyGenerated"
                    value={formData.energyGenerated}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="0.01"
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="e.g., 45.5"
                  />
                  <select
                    name="energyUnit"
                    value={formData.energyUnit}
                    onChange={handleInputChange}
                    className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="kWh">kWh</option>
                    <option value="MWh">MWh</option>
                    <option value="GWh">GWh</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Peak Power (kW)</label>
                <input
                  type="number"
                  name="peakPower"
                  value={formData.peakPower}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., 5.2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Average Power (kW)</label>
                <input
                  type="number"
                  name="averagePower"
                  value={formData.averagePower}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., 3.8"
                />
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">📈 Performance Metrics</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Operating Hours</label>
                <input
                  type="number"
                  name="operatingHours"
                  value={formData.operatingHours}
                  onChange={handleInputChange}
                  min="0"
                  max="24"
                  step="0.1"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="0-24 hours"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Efficiency (%)</label>
                <input
                  type="number"
                  name="efficiency"
                  value={formData.efficiency}
                  onChange={handleInputChange}
                  min="0"
                  max="100"
                  step="0.01"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="0-100%"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cost Savings (LKR)</label>
                <input
                  type="number"
                  name="costSavings"
                  value={formData.costSavings}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., 1250"
                />
              </div>
            </div>
          </div>

          {/* Environmental Conditions */}
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">🌤️ Environmental Conditions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Weather Condition</label>
                <select
                  name="weatherCondition"
                  value={formData.weatherCondition}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  {weatherOptions.map(weather => (
                    <option key={weather} value={weather}>
                      {getWeatherIcon(weather)} {weather}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Temperature (°C)</label>
                <input
                  type="number"
                  name="temperature"
                  value={formData.temperature}
                  onChange={handleInputChange}
                  step="0.1"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., 28.5"
                />
              </div>
            </div>
          </div>

          {/* Maintenance & Notes */}
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">🔧 Maintenance & Notes</h2>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="maintenancePerformed"
                  checked={formData.maintenancePerformed}
                  onChange={handleInputChange}
                  className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <label className="ml-2 text-sm font-medium text-gray-700">
                  Maintenance performed on this day
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Issues or Problems</label>
                <textarea
                  name="issues"
                  value={formData.issues}
                  onChange={handleInputChange}
                  rows="2"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Report any issues or problems encountered..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows="3"
                  maxLength="500"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Any additional observations or comments..."
                />
                <p className="text-xs text-gray-500 mt-1">{formData.notes.length}/500 characters</p>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-6 border-t border-gray-200">
            <button
              type="submit"
              className="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors font-medium text-lg"
            >
              {editingRecord ? '💾 Update Record' : '➕ Create Record'}
            </button>
            {editingRecord && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Recent Records */}
      {records.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <span className="text-3xl mr-2">📋</span>
            Recent Energy Records
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Energy</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Efficiency</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Weather</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {records.slice(0, 10).map((record) => (
                  <tr key={record._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(record.recordDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center gap-2">
                        <span>{getSourceTypeIcon(record.source?.sourceType)}</span>
                        <span>{record.source?.sourceName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                      {formatNumber(record.energyGenerated)} {record.energyUnit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {record.efficiency ? `${formatNumber(record.efficiency)}%` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {getWeatherIcon(record.weatherCondition)} {record.weatherCondition}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      <button
                        onClick={() => handleEdit(record)}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(record._id)}
                        className="text-red-600 hover:text-red-800 font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default RenewableEnergyForm;
