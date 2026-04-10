import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEnergyRecords, deleteEnergyRecord, getConsumptionIntegration } from '../../services/energyApi';
import CreateConsumptionModal from './CreateConsumptionModal';
import EditConsumptionModal from './EditConsumptionModal';
import { Column, Pie } from '@ant-design/charts';
import './SmartMeterAnimations.css';

const ConsumptionList = () => {
  const navigate = useNavigate();
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
  const [activeSummaryTab, setActiveSummaryTab] = useState('all');
  const [showSummary, setShowSummary] = useState(false);
  const [integrationData, setIntegrationData] = useState(null);

  const fetchIntegration = useCallback(async () => {
    try {
      const response = await getConsumptionIntegration();
      setIntegrationData(response.data || null);
    } catch (err) {
      console.error('Error fetching integration metrics:', err);
      setIntegrationData(null);
    }
  }, []);

  const fetchRecords = useCallback(async () => {
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
  }, [filters]);

  useEffect(() => {
    fetchRecords();
  }, [filters, fetchRecords]);

  useEffect(() => {
    if (showSummary) {
      fetchIntegration();
    }
  }, [showSummary, fetchIntegration]);

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

  const getMeterDialAngle = (consumption, maxReading = 500) => {
    const percentage = Math.min(consumption / maxReading, 1);
    return percentage * 180; // 180 degrees for half circle
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
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

    fetchIntegration();
  };

  const handleRecordUpdated = () => {
    fetchRecords();
    fetchIntegration();
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
    const dialAngle = getMeterDialAngle(record.energy_used_kwh);
    const usagePercentage = Math.min((record.energy_used_kwh / 500) * 100, 100);
    const isUpdating = updatingIds.has(record._id);
    const periodType = record.period_type || 'N/A';

    const usageTone = {
      low: {
        badge: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
        cardAccent: 'from-emerald-500/10 to-transparent'
      },
      moderate: {
        badge: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800',
        cardAccent: 'from-yellow-500/10 to-transparent'
      },
      high: {
        badge: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800',
        cardAccent: 'from-orange-500/10 to-transparent'
      },
      critical: {
        badge: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
        cardAccent: 'from-red-500/10 to-transparent'
      }
    };

    const periodTone = {
      hourly: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      daily: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
      weekly: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
      monthly: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
    };

    const tone = usageTone[usageLevel] || usageTone.moderate;
    const periodPill = periodTone[periodType] || 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    
    return (
      <div className="smart-meter relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200/80 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 theme-transition">
        <div className={`absolute inset-x-0 top-0 h-20 bg-gradient-to-b ${tone.cardAccent} pointer-events-none`}></div>

        {/* High usage sparkle effects */}
        {usageLevel === 'critical' && (
          <>
            <div className="energy-sparkle"></div>
            <div className="energy-sparkle"></div>
            <div className="energy-sparkle"></div>
          </>
        )}
        
        {/* Header with status */}
        <div className="relative flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center space-x-2">
              <div className={`status-indicator w-3 h-3 rounded-full usage-level-${usageLevel} meter-pulse`}></div>
              <p className="text-xs font-semibold uppercase tracking-wide text-textSecondary dark:text-gray-400">Smart Meter</p>
            </div>
            <h3 className="mt-1 text-lg font-bold text-gray-900 dark:text-white">
              {record.meter_id || `Meter #${record._id.slice(-4)}`}
            </h3>
            <p className="text-xs text-textSecondary dark:text-gray-400 mt-1">
              Last updated {formatDate(record.consumption_date)}
            </p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${tone.badge}`}>
            {usageLevel.toUpperCase()}
          </span>
        </div>

        {/* Meter Visualization */}
        <div className="flex items-center justify-between gap-4 mb-6">
          {/* Dial Meter */}
          <div className="meter-dial float-animation">
            <div 
              className="meter-needle" 
              style={{ '--needle-angle': `${dialAngle}deg` }}
            ></div>
            <div className="meter-center"></div>
          </div>
          
          {/* Digital Reading */}
          <div className="text-right">
            <div 
              className={`meter-reading text-3xl font-bold text-gray-900 dark:text-white mb-1 ${
                isUpdating ? 'updating' : ''
              }`}
            >
              {record.energy_used_kwh?.toLocaleString() || '0'}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">kWh consumed</div>
            <span className={`inline-flex mt-2 px-2.5 py-1 rounded-full text-xs font-semibold ${periodPill}`}>
              {periodType}
            </span>
          </div>
        </div>

        {/* Usage Progress Bar */}
        <div className="mb-5">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span className="font-medium">Usage Intensity</span>
            <span className="font-semibold">{usagePercentage.toFixed(1)}%</span>
          </div>
          <div className="usage-bar h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              className={`usage-fill h-full rounded-full usage-level-${usageLevel}`}
              style={{ '--usage-width': `${usagePercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="rounded-xl bg-gray-50 dark:bg-gray-700/40 p-3 border border-gray-100 dark:border-gray-700">
            <p className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400 font-semibold">Date</p>
            <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{formatDate(record.consumption_date)}</p>
          </div>
          <div className="rounded-xl bg-gray-50 dark:bg-gray-700/40 p-3 border border-gray-100 dark:border-gray-700">
            <p className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400 font-semibold">Meter Profile</p>
            <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white capitalize">{periodType} tracking</p>
          </div>
          <div className="rounded-xl bg-green-50 dark:bg-green-900/20 p-3 border border-green-100 dark:border-green-800/50">
            <p className="text-[11px] uppercase tracking-wide text-green-700 dark:text-green-300 font-semibold">CO₂ Emission</p>
            <p className="mt-1 text-sm font-bold text-green-700 dark:text-green-300">{(record.energy_used_kwh * 0.527).toFixed(2)} kg</p>
          </div>
          <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 p-3 border border-blue-100 dark:border-blue-800/50">
            <p className="text-[11px] uppercase tracking-wide text-blue-700 dark:text-blue-300 font-semibold">Estimated Cost</p>
            <p className="mt-1 text-sm font-bold text-blue-700 dark:text-blue-300">Rs. {(record.energy_used_kwh * 35).toFixed(2)}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-2 pt-4 border-t border-gray-100 dark:border-gray-700">
          <button
            onClick={() => onEdit(record._id)}
            className="px-3 py-2 text-sm font-semibold text-primary hover:bg-primary/10 rounded-lg transition-colors"
            title="Edit Reading"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(record._id)}
            className="px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            title="Delete Reading"
          >
            Delete
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

  // ── Summary computations ──────────────────────────────────────────
  const summaryRecords = activeSummaryTab === 'all'
    ? records
    : records.filter(r => r.period_type === activeSummaryTab);

  const totalKwh   = summaryRecords.reduce((s, r) => s + (r.energy_used_kwh || 0), 0);
  const totalCO2   = totalKwh * 0.527;
  const totalCost  = totalKwh * 35;
  const avgKwh     = summaryRecords.length > 0 ? totalKwh / summaryRecords.length : 0;
  const peakRecord = summaryRecords.reduce((mx, r) => (!mx || r.energy_used_kwh > mx.energy_used_kwh ? r : mx), null);

  const columnChartData = [...summaryRecords]
    .sort((a, b) => b.energy_used_kwh - a.energy_used_kwh)
    .slice(0, 15)
    .map(r => ({
      label: r.meter_id || `Meter #${r._id.slice(-4)}`,
      value: parseFloat((r.energy_used_kwh || 0).toFixed(2)),
    }));

  const levelCounts = { Low: 0, Moderate: 0, High: 0, Critical: 0 };
  summaryRecords.forEach(r => {
    const level = getUsageLevel(r.energy_used_kwh);
    if      (level === 'low')      levelCounts.Low++;
    else if (level === 'moderate') levelCounts.Moderate++;
    else if (level === 'high')     levelCounts.High++;
    else                           levelCounts.Critical++;
  });
  const pieChartData = Object.entries(levelCounts)
    .filter(([, cnt]) => cnt > 0)
    .map(([type, value]) => ({ type, value }));

  const columnConfig = {
    data: columnChartData,
    xField: 'label',
    yField: 'value',
    columnWidthRatio: 0.65,
    color: ({ value }) => {
      const lv = getUsageLevel(value);
      return lv === 'low' ? '#16a34a' : lv === 'moderate' ? '#d97706' : lv === 'high' ? '#ea580c' : '#dc2626';
    },
    columnStyle: { radius: [4, 4, 0, 0] },
    yAxis: { title: { text: 'Energy Used (kWh)' } },
    xAxis: { label: { autoRotate: true, style: { fontSize: 11 } } },
    tooltip: { formatter: datum => ({ name: 'Energy', value: `${datum.value} kWh` }) },
    height: 220,
  };

  const pieConfig = {
    data: pieChartData,
    angleField: 'value',
    colorField: 'type',
    radius: 0.85,
    innerRadius: 0.6,
    color: ['#16a34a', '#d97706', '#ea580c', '#dc2626'],
    label: false,
    statistic: {
      title: { content: 'Usage' },
      content: { content: `${summaryRecords.length}` },
    },
    legend: { position: 'bottom', offsetY: 4 },
    height: 220,
  };

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
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSummary(prev => !prev)}
              className={`border-2 px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 flex items-center space-x-2 ${
                showSummary
                  ? 'bg-primary border-primary text-white'
                  : 'bg-white dark:bg-gray-800 border-primary text-primary hover:bg-primary hover:text-white'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0120 9.414V19a2 2 0 01-2 2z" />
              </svg>
              <span>{showSummary ? 'Hide Summary' : 'Summary'}</span>
            </button>
            <button
              onClick={() => navigate('/consumption/analytics')}
              className="bg-white dark:bg-gray-800 border-2 border-primary text-primary hover:bg-primary hover:text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span>Analytics</span>
            </button>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-gradient-to-r from-primary to-secondary hover:from-primary-dark hover:to-secondary-dark text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 flex items-center space-x-3 min-w-[160px] justify-center group"
            >
            <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-all duration-300">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
            </div>
              <span>Add Reading</span>
              <div className="w-4 h-4 bg-white/20 rounded-full flex items-center justify-center group-hover:rotate-90 transition-all duration-300">
                <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </button>
          </div>
        </div>

        {/* Filters & Meter Grid — hidden while summary is open */}
        {!showSummary && (
          <>
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
                <option value="weekly">Weekly</option>
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
          </>
        )}

        {/* ── Consumption Summary Panel ─────────────────────────────── */}
        {showSummary && records.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 mb-8 overflow-hidden">
            {/* Panel header */}
            <div className="bg-gradient-to-r from-primary to-secondary px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0120 9.414V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-white font-bold text-lg leading-tight">Consumption Summary</h2>
                  <p className="text-white/70 text-xs">Aggregated insights across your readings</p>
                </div>
              </div>
              {/* Period tabs */}
              <div className="flex bg-white/10 rounded-lg p-1 gap-1">
                {[
                  { key: 'all',     label: 'All' },
                  { key: 'hourly',  label: 'Hourly' },
                  { key: 'daily',   label: 'Daily' },
                  { key: 'weekly',  label: 'Weekly' },
                  { key: 'monthly', label: 'Monthly' },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveSummaryTab(tab.key)}
                    className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-all duration-200 ${
                      activeSummaryTab === tab.key
                        ? 'bg-white text-primary shadow'
                        : 'text-white/80 hover:text-white hover:bg-white/15'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6">
              {summaryRecords.length === 0 ? (
                <div className="text-center py-10 text-gray-400 dark:text-gray-500">
                  <div className="text-4xl mb-2">📭</div>
                  <p className="text-sm">No <span className="font-semibold capitalize">{activeSummaryTab}</span> records found.</p>
                </div>
              ) : (
                <>
                  {/* Cross-component integration metrics */}
                  {integrationData && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                      <div className="rounded-xl border border-cyan-200 dark:border-cyan-800 bg-cyan-50 dark:bg-cyan-900/20 p-4">
                        <p className="text-xs uppercase tracking-wide text-cyan-700 dark:text-cyan-300 font-semibold">Net Grid Usage</p>
                        <p className="text-xl font-bold text-cyan-800 dark:text-cyan-200 mt-1">
                          {integrationData.overview?.thisMonthNetGridKwh || 0} kWh
                        </p>
                        <p className="text-xs text-cyan-600 dark:text-cyan-400 mt-1">Consumption - renewable this month</p>
                      </div>

                      <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 p-4">
                        <p className="text-xs uppercase tracking-wide text-emerald-700 dark:text-emerald-300 font-semibold">Renewable Offset</p>
                        <p className="text-xl font-bold text-emerald-800 dark:text-emerald-200 mt-1">
                          {integrationData.overview?.thisMonthRenewableKwh || 0} kWh
                        </p>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">From renewable tracking component</p>
                      </div>

                      <div className="rounded-xl border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-900/20 p-4">
                        <p className="text-xs uppercase tracking-wide text-violet-700 dark:text-violet-300 font-semibold">Billed This Month</p>
                        <p className="text-xl font-bold text-violet-800 dark:text-violet-200 mt-1">
                          Rs. {integrationData.overview?.thisMonthBilledAmount || 0}
                        </p>
                        <p className="text-xs text-violet-600 dark:text-violet-400 mt-1">From energy reports & bills component</p>
                      </div>

                      <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4">
                        <p className="text-xs uppercase tracking-wide text-amber-700 dark:text-amber-300 font-semibold">Device Link Coverage</p>
                        <p className="text-xl font-bold text-amber-800 dark:text-amber-200 mt-1">
                          {integrationData.links?.recentCoveragePercent || 0}%
                        </p>
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Records connected to devices</p>
                      </div>
                    </div>
                  )}

                  {/* KPI Strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                    {[
                      {
                        icon: '📋',
                        label: 'Total Records',
                        value: summaryRecords.length,
                        sub: 'readings captured',
                        color: 'from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20',
                        accent: 'border-l-blue-500',
                        text: 'text-blue-700 dark:text-blue-300',
                      },
                      {
                        icon: '⚡',
                        label: 'Total Energy',
                        value: `${totalKwh.toFixed(2)} kWh`,
                        sub: `avg ${avgKwh.toFixed(1)} kWh/record`,
                        color: 'from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20',
                        accent: 'border-l-yellow-500',
                        text: 'text-yellow-700 dark:text-yellow-300',
                      },
                      {
                        icon: '🌿',
                        label: 'CO₂ Emitted',
                        value: `${totalCO2.toFixed(2)} kg`,
                        sub: `~ ${(totalCO2 / 1000).toFixed(3)} tonnes`,
                        color: 'from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20',
                        accent: 'border-l-green-500',
                        text: 'text-green-700 dark:text-green-300',
                      },
                      {
                        icon: '💰',
                        label: 'Est. Cost',
                        value: `Rs. ${totalCost.toFixed(0)}`,
                        sub: `@ Rs.35/kWh`,
                        color: 'from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20',
                        accent: 'border-l-purple-500',
                        text: 'text-purple-700 dark:text-purple-300',
                      },
                      {
                        icon: '🔺',
                        label: 'Peak Reading',
                        value: peakRecord ? `${peakRecord.energy_used_kwh} kWh` : '—',
                        sub: peakRecord ? (peakRecord.meter_id || `Meter #${peakRecord._id.slice(-4)}`) : '',
                        color: 'from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20',
                        accent: 'border-l-red-500',
                        text: 'text-red-700 dark:text-red-300',
                      },
                    ].map(kpi => (
                      <div
                        key={kpi.label}
                        className={`bg-gradient-to-br ${kpi.color} border-l-4 ${kpi.accent} rounded-xl p-4 shadow-sm`}
                      >
                        <div className="text-2xl mb-1">{kpi.icon}</div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{kpi.label}</p>
                        <p className={`text-xl font-bold ${kpi.text} leading-tight mt-0.5`}>{kpi.value}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{kpi.sub}</p>
                      </div>
                    ))}
                  </div>

                  {/* Charts row */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Column chart – Top readings */}
                    <div className="lg:col-span-2 bg-gray-50 dark:bg-gray-900/50 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">
                            Top Readings by Consumption
                          </h3>
                          <p className="text-xs text-gray-400 dark:text-gray-500">Highest {Math.min(columnChartData.length, 15)} records (kWh)</p>
                        </div>
                        <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-semibold capitalize">
                          {activeSummaryTab}
                        </span>
                      </div>
                      {columnChartData.length > 0 ? (
                        <div className="bg-white rounded-lg overflow-hidden">
                          <Column {...columnConfig} />
                        </div>
                      ) : (
                        <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">No data</div>
                      )}
                    </div>

                    {/* Pie chart – Usage level distribution */}
                    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-5 border border-gray-100 dark:border-gray-700 flex flex-col">
                      <div className="mb-4">
                        <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">Usage Level Distribution</h3>
                        <p className="text-xs text-gray-400 dark:text-gray-500">Low / Moderate / High / Critical</p>
                      </div>
                      {pieChartData.length > 0 ? (
                        <div className="bg-white rounded-lg overflow-hidden">
                          <Pie {...pieConfig} />
                        </div>
                      ) : (
                        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">No data</div>
                      )}
                      {/* Legend */}
                      <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1">
                        {[
                          { label: 'Low',      color: '#16a34a', range: '≤ 50 kWh'  },
                          { label: 'Moderate', color: '#d97706', range: '≤ 150 kWh' },
                          { label: 'High',     color: '#ea580c', range: '≤ 300 kWh' },
                          { label: 'Critical', color: '#dc2626', range: '> 300 kWh' },
                        ].map(l => (
                          <div key={l.label} className="flex items-center space-x-1.5">
                            <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: l.color }}></span>
                            <span className="text-xs text-gray-600 dark:text-gray-400">{l.label}</span>
                            <span className="text-xs text-gray-400 dark:text-gray-500">({l.range})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Period breakdown mini-stats */}
                  {activeSummaryTab === 'all' && (
                    <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {['hourly', 'daily', 'weekly', 'monthly'].map(pt => {
                        const pts = records.filter(r => r.period_type === pt);
                        const ptKwh = pts.reduce((s, r) => s + (r.energy_used_kwh || 0), 0);
                        const colors = {
                          hourly: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300',
                          daily:  'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300',
                          weekly: 'bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300',
                          monthly:'bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-800 text-pink-700 dark:text-pink-300',
                        };
                        return (
                          <button
                            key={pt}
                            onClick={() => setActiveSummaryTab(pt)}
                            className={`border rounded-xl p-3 text-left hover:shadow-md transition-all duration-200 hover:scale-105 ${colors[pt]}`}
                          >
                            <p className="text-xs font-semibold uppercase tracking-wide opacity-70 mb-0.5">{pt}</p>
                            <p className="font-bold text-base">{pts.length} records</p>
                            <p className="text-xs opacity-75">{ptKwh.toFixed(1)} kWh total</p>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {!showSummary && (
          <>
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
          </>
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