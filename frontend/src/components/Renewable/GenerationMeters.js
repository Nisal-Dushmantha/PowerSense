import React, { useCallback, useState, useEffect } from 'react';
import { renewableService } from '../../services/api';

const GenerationMeters = () => {
  const [metersData, setMetersData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('24h');

  const fetchMetersData = useCallback(async () => {
    try {
      setLoading(true);
      const params = { period };
      
      const response = await renewableService.getGenerationMeters(params);
      setMetersData(response.data.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching meters data:', err);
      setError('Failed to load generation meters data');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchMetersData();
  }, [fetchMetersData]);

  const getStatusColor = (utilizationRate) => {
    if (utilizationRate >= 80) return 'bg-green-500';
    if (utilizationRate >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getStatusText = (utilizationRate) => {
    if (utilizationRate >= 80) return 'Excellent';
    if (utilizationRate >= 50) return 'Good';
    return 'Low';
  };

  const formatNumber = (num) => {
    if (!num) return '0';
    return num.toFixed(2);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString();
  };

  const getSourceIcon = (type) => {
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Period Selector */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">⚡ Generation Meters</h2>
          <p className="text-gray-600 text-sm mt-1">Real-time monitoring of renewable energy generation</p>
        </div>
        
        <div className="flex gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
        </div>
      </div>

      {/* Meters Grid */}
      {metersData.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-500">No generation data available for the selected period.</p>
          <p className="text-gray-400 text-sm mt-2">Add renewable sources and record energy generation to see meters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {metersData.map((meter) => (
            <div key={meter._id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
              {/* Meter Header */}
              <div className="bg-gradient-to-r from-green-600 to-emerald-500 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{getSourceIcon(meter.sourceType)}</span>
                    <div>
                      <h3 className="text-white font-bold text-lg">{meter.sourceName}</h3>
                      <p className="text-green-100 text-sm">{meter.sourceType}</p>
                    </div>
                  </div>
                  <div className={`${getStatusColor(meter.utilizationRate || 0)} text-white px-3 py-1 rounded-full text-xs font-semibold`}>
                    {getStatusText(meter.utilizationRate || 0)}
                  </div>
                </div>
              </div>

              {/* Meter Body */}
              <div className="p-6 space-y-4">
                {/* Current Generation */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-100">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-gray-600 text-sm font-medium">Current Generation</p>
                      <p className="text-3xl font-bold text-green-600 mt-1">
                        {formatNumber(meter.currentGeneration)}
                        <span className="text-lg ml-1">kWh</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-600 text-sm">Capacity</p>
                      <p className="text-lg font-semibold text-gray-700">
                        {meter.capacity} {meter.capacityUnit}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-gray-600 text-xs font-medium">Total Generated</p>
                    <p className="text-xl font-bold text-gray-800 mt-1">
                      {formatNumber(meter.totalGeneration)} kWh
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-gray-600 text-xs font-medium">Average</p>
                    <p className="text-xl font-bold text-gray-800 mt-1">
                      {formatNumber(meter.averageGeneration)} kWh
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-gray-600 text-xs font-medium">Peak Generation</p>
                    <p className="text-xl font-bold text-yellow-600 mt-1">
                      {formatNumber(meter.peakGeneration)} kWh
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-gray-600 text-xs font-medium">Efficiency</p>
                    <p className="text-xl font-bold text-blue-600 mt-1">
                      {formatNumber(meter.currentEfficiency)}%
                    </p>
                  </div>
                </div>

                {/* Utilization Bar */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600 font-medium">Utilization Rate</span>
                    <span className="font-bold text-gray-800">
                      {formatNumber(meter.utilizationRate || 0)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${getStatusColor(meter.utilizationRate || 0)}`}
                      style={{ width: `${Math.min(meter.utilizationRate || 0, 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                  <div>
                    <p className="text-xs text-gray-500">Operating Hours</p>
                    <p className="font-semibold text-gray-700">{formatNumber(meter.operatingTime)}h</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Last Update</p>
                    <p className="font-semibold text-gray-700 text-xs">
                      {formatDate(meter.lastUpdate)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      {metersData.length > 0 && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
          <h3 className="text-lg font-bold mb-4">📊 Overall Summary ({period})</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-blue-100 text-sm">Total Sources</p>
              <p className="text-2xl font-bold">{metersData.length}</p>
            </div>
            <div>
              <p className="text-blue-100 text-sm">Total Generated</p>
              <p className="text-2xl font-bold">
                {formatNumber(metersData.reduce((sum, m) => sum + m.totalGeneration, 0))} kWh
              </p>
            </div>
            <div>
              <p className="text-blue-100 text-sm">Avg Efficiency</p>
              <p className="text-2xl font-bold">
                {formatNumber(metersData.reduce((sum, m) => sum + (m.averageEfficiency || 0), 0) / metersData.length)}%
              </p>
            </div>
            <div>
              <p className="text-blue-100 text-sm">Peak Power</p>
              <p className="text-2xl font-bold">
                {formatNumber(Math.max(...metersData.map(m => m.peakGeneration || 0)))} kWh
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GenerationMeters;
