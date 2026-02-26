import React, { useState, useEffect } from 'react';
import { getEnergyRecords, deleteEnergyRecord } from '../../services/energyApi';
import CreateConsumptionModal from './CreateConsumptionModal';
import EditConsumptionModal from './EditConsumptionModal';
import './SmartMeterAnimations.css';

const ConsumptionList = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedRecordId, setSelectedRecordId] = useState(null);
  const [updatingIds, setUpdatingIds] = useState(new Set());
  const [filters, setFilters] = useState({
    period_type: '',
    startDate: '',
    endDate: '',
    search: ''
  });

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const queryParams = {};
      
      if (filters.period_type) queryParams.period_type = filters.period_type;
      if (filters.startDate) queryParams.startDate = filters.startDate;
      if (filters.endDate) queryParams.endDate = filters.endDate;
      if (filters.search) queryParams.search = filters.search;

      const response = await getEnergyRecords(queryParams);
      
      // Mark all records as updating for animation
      const newRecords = response.data || [];
      const newUpdatingIds = new Set(newRecords.map(record => record._id));
      setUpdatingIds(newUpdatingIds);
      
      setRecords(newRecords);
      setError(null);
      
      // Remove updating animation after delay
      setTimeout(() => {
        setUpdatingIds(new Set());
      }, 800);
    } catch (err) {
      setError('Failed to fetch energy consumption records');
      console.error('Error fetching records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [filters]);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      try {
        await deleteEnergyRecord(id);
        setRecords(records.filter(record => record._id !== id));
      } catch (err) {
        setError('Failed to delete record');
        console.error('Error deleting record:', err);
      }
    }
  };

  // Smart meter utility functions
  const getUsageLevel = (consumption) => {
    if (consumption <= 50) return 'low';
    if (consumption <= 150) return 'moderate';
    if (consumption <= 300) return 'high';
    return 'critical';
  };

  const getUsageLevelColor = (level) => {
    const colors = {
      low: '#2ECC71',
      moderate: '#F1C40F', 
      high: '#E67E22',
      critical: '#E74C3C'
    };
    return colors[level] || colors.low;
  };

  const getMeterDialAngle = (consumption, maxReading = 500) => {
    const percentage = Math.min(consumption / maxReading, 1);
    return percentage * 180; // 180 degrees for half circle
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatEnergy = (kwh) => {
    return `${parseFloat(kwh).toFixed(2)} kWh`;
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleRecordCreated = (newRecord) => {
    // Add updating animation for new record
    setUpdatingIds(prev => new Set([...prev, newRecord._id]));
    setRecords(prevRecords => [newRecord, ...prevRecords]);
    
    // Remove animation after delay
    setTimeout(() => {
      setUpdatingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(newRecord._id);
        return newSet;
      });
    }, 800);
  };

  const handleRecordUpdated = () => {
    fetchRecords();
  };

  const handleEditClick = (recordId) => {
    setSelectedRecordId(recordId);
    setIsEditModalOpen(true);
  };

  const handleEditModalClose = () => {
    setIsEditModalOpen(false);
    setSelectedRecordId(null);
  };

  // Smart Meter Card Component
  const SmartMeterCard = ({ record, onEdit, onDelete }) => {
    const usageLevel = getUsageLevel(record.energy_used_kwh);
    const usageColor = getUsageLevelColor(usageLevel);
    const dialAngle = getMeterDialAngle(record.energy_used_kwh);
    const usagePercentage = Math.min((record.energy_used_kwh / 500) * 100, 100);
    const isUpdating = updatingIds.has(record._id);
    
    return (
      <div className="smart-meter bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-lg theme-transition">
        {/* High usage sparkle effects */}
        {usageLevel === 'critical' && (
          <>
            <div className="energy-sparkle"></div>
            <div className="energy-sparkle"></div>
            <div className="energy-sparkle"></div>
          </>
        )}
        
        {/* Header with status */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div 
              className={`status-indicator w-4 h-4 rounded-full usage-level-${usageLevel} meter-pulse`}
            ></div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Meter #{record.meter_number || record._id.slice(-4)}
            </h3>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
            usageLevel === 'low' ? 'bg-primary/10 text-primary border-primary/20' :
            usageLevel === 'moderate' ? 'bg-yellow-50 text-yellow-600 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400' :
            usageLevel === 'high' ? 'bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400' :
            'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400'
          }`}>
            {usageLevel.toUpperCase()}
          </span>
        </div>

        {/* Meter Visualization */}
        <div className="flex items-center justify-between mb-6">
          {/* Dial Meter */}
          <div className="meter-dial float-animation">
            <div 
              className="meter-needle" 
              style={{ '--needle-angle': `${dialAngle}deg` }}
            ></div>
            <div className="meter-center"></div>
          </div>
          
          {/* Digital Reading */}
          <div className="text-center">
            <div 
              className={`meter-reading text-3xl font-bold text-gray-900 dark:text-white mb-1 ${
                isUpdating ? 'updating' : ''
              }`}
            >
              {record.energy_used_kwh?.toLocaleString() || '0'}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">kWh consumed</div>
          </div>
        </div>

        {/* Usage Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span>Usage Level</span>
            <span>{usagePercentage.toFixed(1)}%</span>
          </div>
          <div className="usage-bar h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              className={`usage-fill h-full rounded-full usage-level-${usageLevel}`}
              style={{ '--usage-width': `${usagePercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
          <div>
            <span className="text-gray-500 dark:text-gray-400">Date</span>
            <p className="font-medium text-gray-900 dark:text-white">
              {formatDate(record.consumption_date)}
            </p>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Period</span>
            <p className="font-medium text-gray-900 dark:text-white capitalize">
              {record.period_type || 'N/A'}
            </p>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Current</span>
            <p className="font-medium text-gray-900 dark:text-white">
              {record.current_reading?.toLocaleString() || 'N/A'}
            </p>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Previous</span>
            <p className="font-medium text-gray-900 dark:text-white">
              {record.previous_reading?.toLocaleString() || 'N/A'}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-2 pt-4 border-t border-gray-100 dark:border-gray-700">
          <button
            onClick={() => onEdit(record._id)}
            className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-all duration-200 hover:scale-110"
            title="Edit Reading"
          >
            ✏️
          </button>
          <button
            onClick={() => onDelete(record._id)}
            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200 hover:scale-110"
            title="Delete Reading"
          >
            🗑️
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-light-mint via-white to-background dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-300">Loading smart meters...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-light-mint via-white to-background dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center">
              <span className="text-red-600 dark:text-red-400 mr-2">⚠️</span>
              <span className="text-red-600 dark:text-red-400">{error}</span>
              <button 
                onClick={fetchRecords}
                className="ml-4 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 underline font-medium transition-colors duration-200"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-light-mint via-white to-background dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-textPrimary dark:text-gray-100 mb-2">
              ⚡ Smart Energy Meters
            </h1>
            <p className="text-textSecondary dark:text-gray-300">
              Monitor your energy consumption with intelligent meter visualizations
            </p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <span>➕</span>
            <span>Add Reading</span>
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8 border border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <span className="mr-2">🔍</span>
            Filter & Search
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-textPrimary dark:text-gray-200 mb-2">Period Type</label>
              <select 
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200"
                value={filters.period_type}
                onChange={(e) => handleFilterChange('period_type', e.target.value)}
              >
                <option value="">All Types</option>
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-textPrimary dark:text-gray-200 mb-2">Start Date</label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-textPrimary dark:text-gray-200 mb-2">End Date</label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-textPrimary dark:text-gray-200 mb-2">Search</label>
              <input
                type="text"
                placeholder="Search meters..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Content Area */}
        {records.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 shadow-lg">
            <div className="text-6xl mb-4">⚡</div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No energy meters found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Start monitoring your energy consumption by adding your first meter reading.
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="btn-primary"
            >
              Add First Reading
            </button>
          </div>
        ) : (
          /* Smart Meter Grid View */
          <div className="meter-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {records.map((record) => (
              <SmartMeterCard
                key={record._id}
                record={record}
                onEdit={handleEditClick}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        {/* Modals */}
        <CreateConsumptionModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onRecordCreated={handleRecordCreated}
        />
        
        <EditConsumptionModal
          isOpen={isEditModalOpen}
          onClose={handleEditModalClose}
          onRecordUpdated={handleRecordUpdated}
          recordId={selectedRecordId}
        />
      </div>
    </div>
  );
};

export default ConsumptionList;