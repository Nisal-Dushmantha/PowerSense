import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { renewableService } from '../../services/api';

const RenewableSource = () => {
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingSource, setEditingSource] = useState(null);

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

  useEffect(() => {
    fetchSources();
  }, []);

  const fetchSources = async () => {
    try {
      setLoading(true);
      const response = await renewableService.getSources();
      setSources(response.data.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch renewable sources');
      console.error('Error fetching sources:', err);
    } finally {
      setLoading(false);
    }
  };

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

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loading-spinner w-12 h-12"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4">
        <div className="flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          <span>{error}</span>
        </div>
        <button 
          onClick={fetchSources}
          className="ml-4 text-red-600 hover:text-red-800 underline font-medium"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-textPrimary dark:text-gray-100">Renewable Energy Sources</h1>
          <p className="text-textSecondary dark:text-gray-300 mt-1">Manage your renewable energy installations</p>
        </div>
        <button
          onClick={handleAddNew}
          className="btn-primary flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
          </svg>
          Add New Source
        </button>
      </div>

      {sources.length === 0 ? (
        <div className="text-center py-12">
          <div className="card card-gradient max-w-md mx-auto">
            <div className="card-body text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M13 3h-2v10h2V3zm4.83 2.17l-1.42 1.42C17.99 7.86 19 9.81 19 12c0 3.87-3.13 7-7 7s-7-3.13-7-7c0-2.19 1.01-4.14 2.58-5.42L6.17 5.17C4.23 6.82 3 9.26 3 12c0 4.97 4.03 9 9 9s9-4.03 9-9c0-2.74-1.23-5.18-3.17-6.83z"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-textPrimary dark:text-gray-100 mb-2">No sources found</h3>
              <p className="text-textSecondary dark:text-gray-300 mb-6">Start by creating your first renewable energy source</p>
              <button
                onClick={handleAddNew}
                className="btn-primary inline-flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                </svg>
                Create Your First Source
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="card overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th>Source Name</th>
                  <th>Type</th>
                  <th>Capacity</th>
                  <th>Location</th>
                  <th>Installation Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sources.map((source) => (
                  <tr key={source._id} className="table-row">
                    <td className="table-cell font-medium text-textPrimary dark:text-gray-100">
                      {source.sourceName}
                    </td>
                    <td className="table-cell">
                      <span className="badge badge-secondary">
                        {source.sourceType}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className="font-semibold text-textPrimary dark:text-gray-200">{source.capacity}</span> 
                      <span className="text-textSecondary dark:text-gray-400"> {source.capacityUnit}</span>
                    </td>
                    <td className="table-cell text-textSecondary dark:text-gray-400">
                      {source.location || 'N/A'}
                    </td>
                    <td className="table-cell">
                      {formatDate(source.installationDate)}
                    </td>
                    <td className="table-cell">
                      <span className={`badge ${
                        source.status === 'Active' ? 'badge-success' : 
                        source.status === 'Maintenance' ? 'badge-warning' : 
                        'badge-secondary'
                      }`}>
                        {source.status}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center space-x-2">
                        <Link
                          to={`/renewable/records?source=${source._id}`}
                          className="btn-ghost btn-sm text-primary hover:text-primary-dark dark:text-primary dark:hover:text-primary-light"
                          title="View Records"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M9 2v2h6V2h2v2h1c1.1 0 2 .9 2 2v14c0 1.1-.9 2-2 2H6c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2h1V2h2zm-2 6v10h10V8H7z"/>
                          </svg>
                        </Link>
                        <button
                          onClick={() => handleEdit(source)}
                          className="btn-ghost btn-sm text-secondary hover:text-primary dark:text-secondary dark:hover:text-primary-light"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(source._id)}
                          className="btn-ghost btn-sm text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-4 p-4">
            {sources.map((source) => (
              <div key={source._id} className="card-hover p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-textPrimary dark:text-gray-100">{source.sourceName}</h3>
                    <p className="text-sm text-textSecondary dark:text-gray-400">{source.sourceType}</p>
                  </div>
                  <span className={`badge ${
                    source.status === 'Active' ? 'badge-success' : 
                    source.status === 'Maintenance' ? 'badge-warning' : 
                    'badge-secondary'
                  }`}>
                    {source.status}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div>
                    <span className="text-textSecondary dark:text-gray-400">Capacity</span>
                    <p className="font-semibold text-textPrimary dark:text-gray-200">
                      {source.capacity} {source.capacityUnit}
                    </p>
                  </div>
                  <div>
                    <span className="text-textSecondary dark:text-gray-400">Location</span>
                    <p className="font-semibold text-textPrimary dark:text-gray-200">{source.location || 'N/A'}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-textSecondary dark:text-gray-400">Installed</span>
                    <p className="font-semibold text-textPrimary dark:text-gray-200">{formatDate(source.installationDate)}</p>
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Link
                    to={`/renewable/records?source=${source._id}`}
                    className="btn-secondary btn-sm"
                  >
                    Records
                  </Link>
                  <button
                    onClick={() => handleEdit(source)}
                    className="btn-secondary btn-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(source._id)}
                    className="btn-danger btn-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-green-500 to-blue-500 text-white p-6 rounded-t-xl">
              <h2 className="text-2xl font-bold">
                {editingSource ? 'Edit Renewable Source' : 'Add New Renewable Source'}
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
                      <option key={type} value={type}>{type}</option>
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
                  {editingSource ? 'Update Source' : 'Create Source'}
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
