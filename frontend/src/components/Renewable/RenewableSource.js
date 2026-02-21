import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { renewableService } from '../../services/api';

const RenewableSource = () => {
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingSource, setEditingSource] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');

  const sourceTypes = ['Solar', 'Wind', 'Hydro', 'Biomass', 'Geothermal', 'Other'];
  const statusOptions = ['Active', 'Inactive', 'Maintenance'];

  const initialFormState = {
    sourceName: '',
    sourceType: 'Solar',
    capacity: '',
    capacityUnit: 'kW',
    installationDate: '',
    location: '',
    status: 'Active',
    description: '',
    estimatedAnnualProduction: '',
    manufacturer: '',
    warrantyExpiry: ''
  };

  const [formData, setFormData] = useState(initialFormState);

  const fetchSources = React.useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterStatus) params.status = filterStatus;
      if (filterType) params.sourceType = filterType;
      
      const response = await renewableService.getSources(params);
      setSources(response.data.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch renewable sources');
      console.error('Error fetching sources:', err);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterType]);

  useEffect(() => {
    fetchSources();
  }, [fetchSources]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSource) {
        await renewableService.updateSource(editingSource._id, formData);
      } else {
        await renewableService.createSource(formData);
      }
      
      setShowModal(false);
      setEditingSource(null);
      setFormData(initialFormState);
      fetchSources();
    } catch (err) {
      setError(editingSource ? 'Failed to update source' : 'Failed to create source');
      console.error('Error saving source:', err);
    }
  };

  const handleEdit = (source) => {
    setEditingSource(source);
    setFormData({
      sourceName: source.sourceName,
      sourceType: source.sourceType,
      capacity: source.capacity,
      capacityUnit: source.capacityUnit,
      installationDate: source.installationDate ? source.installationDate.split('T')[0] : '',
      location: source.location || '',
      status: source.status,
      description: source.description || '',
      estimatedAnnualProduction: source.estimatedAnnualProduction || '',
      manufacturer: source.manufacturer || '',
      warrantyExpiry: source.warrantyExpiry ? source.warrantyExpiry.split('T')[0] : ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this source? All associated energy records will also be deleted.')) {
      try {
        await renewableService.deleteSource(id);
        setSources(sources.filter(source => source._id !== id));
      } catch (err) {
        setError('Failed to delete source');
        console.error('Error deleting source:', err);
      }
    }
  };

  const handleAddNew = () => {
    setEditingSource(null);
    setFormData(initialFormState);
    setShowModal(true);
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

  const getStatusColor = (status) => {
    const colors = {
      Active: 'bg-green-100 text-green-800 border-green-200',
      Inactive: 'bg-gray-100 text-gray-800 border-gray-200',
      Maintenance: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 flex items-center">
            <span className="text-5xl mr-3">⚡</span>
            Renewable Energy Sources
          </h1>
          <p className="text-gray-600 mt-2">Manage your renewable energy installations</p>
        </div>
        <button
          onClick={handleAddNew}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center gap-2"
        >
          <span className="text-xl">+</span>
          Add New Source
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg flex items-center">
          <span className="text-2xl mr-3">⚠️</span>
          <div>
            <p className="font-semibold">{error}</p>
            <button 
              onClick={fetchSources}
              className="mt-2 text-red-600 hover:text-red-800 underline text-sm"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="text-sm font-medium text-gray-700 mr-2">Status:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              {statusOptions.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mr-2">Type:</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">All Types</option>
              {sourceTypes.map(type => (
                <option key={type} value={type}>{getSourceTypeIcon(type)} {type}</option>
              ))}
            </select>
          </div>
          {(filterStatus || filterType) && (
            <button
              onClick={() => {
                setFilterStatus('');
                setFilterType('');
              }}
              className="text-gray-600 hover:text-gray-800 underline text-sm"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Sources Grid */}
      {sources.length === 0 ? (
        <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-xl shadow-lg p-12 text-center border-2 border-dashed border-gray-300">
          <div className="text-8xl mb-4">🌱</div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">No Renewable Sources Yet</h3>
          <p className="text-gray-600 mb-6">Start by adding your first renewable energy source.</p>
          <button
            onClick={handleAddNew}
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg transition-all shadow-lg"
          >
            Add Your First Source
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sources.map((source) => (
            <div 
              key={source._id}
              className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-1 overflow-hidden border border-gray-200"
            >
              {/* Card Header */}
              <div className="bg-gradient-to-r from-green-500 to-blue-500 p-4 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{getSourceTypeIcon(source.sourceType)}</span>
                    <div>
                      <h3 className="font-bold text-xl">{source.sourceName}</h3>
                      <p className="text-sm opacity-90">{source.sourceType}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(source.status)}`}>
                    {source.status}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 text-sm">Capacity:</span>
                  <span className="font-bold text-gray-800">{source.capacity} {source.capacityUnit}</span>
                </div>
                
                {source.location && (
                  <div className="flex items-start justify-between">
                    <span className="text-gray-600 text-sm">Location:</span>
                    <span className="font-medium text-gray-800 text-right text-sm">{source.location}</span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-gray-600 text-sm">Installed:</span>
                  <span className="font-medium text-gray-800 text-sm">{formatDate(source.installationDate)}</span>
                </div>

                {source.estimatedAnnualProduction && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 text-sm">Est. Annual:</span>
                    <span className="font-medium text-gray-800 text-sm">{source.estimatedAnnualProduction} kWh</span>
                  </div>
                )}

                {source.manufacturer && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 text-sm">Manufacturer:</span>
                    <span className="font-medium text-gray-800 text-sm">{source.manufacturer}</span>
                  </div>
                )}

                {source.warrantyExpiry && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 text-sm">Warranty Until:</span>
                    <span className={`font-medium text-sm ${source.isWarrantyValid ? 'text-green-600' : 'text-red-600'}`}>
                      {formatDate(source.warrantyExpiry)}
                    </span>
                  </div>
                )}

                {source.description && (
                  <div className="pt-2 border-t border-gray-200">
                    <p className="text-gray-600 text-sm italic">{source.description}</p>
                  </div>
                )}
              </div>

              {/* Card Footer */}
              <div className="p-4 bg-gray-50 flex gap-2">
                <button
                  onClick={() => handleEdit(source)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                >
                  ✏️ Edit
                </button>
                <Link
                  to={`/renewable/records?source=${source._id}`}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium text-center"
                >
                  📊 Records
                </Link>
                <button
                  onClick={() => handleDelete(source._id)}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-green-500 to-blue-500 text-white p-6 rounded-t-xl">
              <h2 className="text-2xl font-bold">
                {editingSource ? '✏️ Edit Renewable Source' : '➕ Add New Renewable Source'}
              </h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Source Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="sourceName"
                    value={formData.sourceName}
                    onChange={handleInputChange}
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="e.g., Rooftop Solar Panel"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Source Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="sourceType"
                    value={formData.sourceType}
                    onChange={handleInputChange}
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    {sourceTypes.map(type => (
                      <option key={type} value={type}>{getSourceTypeIcon(type)} {type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Capacity <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      name="capacity"
                      value={formData.capacity}
                      onChange={handleInputChange}
                      required
                      min="0"
                      step="0.01"
                      className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="e.g., 5"
                    />
                    <select
                      name="capacityUnit"
                      value={formData.capacityUnit}
                      onChange={handleInputChange}
                      className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="kW">kW</option>
                      <option value="MW">MW</option>
                      <option value="GW">GW</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Installation Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="installationDate"
                    value={formData.installationDate}
                    onChange={handleInputChange}
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="e.g., Rooftop Section A"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    {statusOptions.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estimated Annual Production (kWh)
                  </label>
                  <input
                    type="number"
                    name="estimatedAnnualProduction"
                    value={formData.estimatedAnnualProduction}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="e.g., 7500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Manufacturer</label>
                  <input
                    type="text"
                    name="manufacturer"
                    value={formData.manufacturer}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="e.g., Tesla, SunPower"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Warranty Expiry Date</label>
                  <input
                    type="date"
                    name="warrantyExpiry"
                    value={formData.warrantyExpiry}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Additional details about this renewable source..."
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors font-medium"
                >
                  {editingSource ? '💾 Update Source' : '➕ Create Source'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingSource(null);
                    setFormData(initialFormState);
                  }}
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RenewableSource;
