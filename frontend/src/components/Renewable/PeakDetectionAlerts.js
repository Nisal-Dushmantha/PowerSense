import React, { useCallback, useState, useEffect } from 'react';
import { renewableService } from '../../services/api';

const PeakDetectionAlerts = () => {
  const [peakData, setPeakData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [days, setDays] = useState(30);
  const [threshold, setThreshold] = useState(50);
  const [activeTab, setActiveTab] = useState('peaks');

  const fetchPeakData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await renewableService.getPeakGeneration({ days });
      setPeakData(response.data.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching peak data:', err);
      setError('Failed to load peak generation data');
    } finally {
      setLoading(false);
    }
  }, [days]);

  const fetchAlerts = useCallback(async () => {
    try {
      const response = await renewableService.getProductionAlerts({ thresholdPercentage: threshold });
      setAlerts(response.data.data);
    } catch (err) {
      console.error('Error fetching alerts:', err);
    }
  }, [threshold]);

  useEffect(() => {
    fetchPeakData();
    fetchAlerts();
  }, [fetchPeakData, fetchAlerts]);

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 border-red-300 text-red-800';
      case 'warning':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'info':
        return 'bg-blue-100 border-blue-300 text-blue-800';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical':
        return '🚨';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '📋';
    }
  };

  const getAlertTypeLabel = (type) => {
    const labels = {
      no_data: 'No Data',
      low_production: 'Low Production',
      low_efficiency: 'Low Efficiency',
      maintenance_required: 'Maintenance Required'
    };
    return labels[type] || type;
  };

  const formatNumber = (num) => {
    if (!num) return '0';
    return num.toFixed(2);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString();
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">📈 Peak Detection & Alerts</h2>
          <p className="text-gray-600 text-sm mt-1">Analyze peak generation and monitor production thresholds</p>
        </div>
        
        <div className="flex gap-2">
          <select
            value={days}
            onChange={(e) => setDays(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="60">Last 60 Days</option>
            <option value="90">Last 90 Days</option>
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-4">
          <button
            onClick={() => setActiveTab('peaks')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'peaks'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            📊 Peak Analysis
          </button>
          <button
            onClick={() => setActiveTab('alerts')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'alerts'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            🔔 Alerts {alerts.length > 0 && `(${alerts.length})`}
          </button>
        </nav>
      </div>

      {/* Peak Analysis Tab */}
      {activeTab === 'peaks' && peakData && (
        <div className="space-y-6">
          {/* Peak Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl p-6 text-white shadow-lg">
              <p className="text-yellow-100 text-sm">Overall Peak</p>
              <p className="text-3xl font-bold mt-2">
                {formatNumber(peakData.statistics?.overallPeak || 0)} kWh
              </p>
              <p className="text-yellow-100 text-xs mt-1">Maximum generation recorded</p>
            </div>
            
            <div className="bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl p-6 text-white shadow-lg">
              <p className="text-blue-100 text-sm">Average Peak Power</p>
              <p className="text-3xl font-bold mt-2">
                {formatNumber(peakData.statistics?.avgPeak || 0)} kW
              </p>
              <p className="text-blue-100 text-xs mt-1">Mean peak power output</p>
            </div>
            
            <div className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl p-6 text-white shadow-lg">
              <p className="text-green-100 text-sm">Peak Efficiency</p>
              <p className="text-3xl font-bold mt-2">
                {formatNumber(peakData.statistics?.peakEfficiency || 0)}%
              </p>
              <p className="text-green-100 text-xs mt-1">Highest efficiency achieved</p>
            </div>
          </div>

          {/* Peak by Hour */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">⏰ Peak Generation by Hour</h3>
            <div className="grid grid-cols-6 sm:grid-cols-12 gap-2">
              {peakData.peakByHour?.map((hour) => {
                const maxGeneration = Math.max(...peakData.peakByHour.map(h => h.maxGeneration));
                const heightPercent = (hour.maxGeneration / maxGeneration) * 100;
                
                return (
                  <div key={hour._id} className="flex flex-col items-center">
                    <div className="relative w-full h-32 flex items-end">
                      <div
                        className="w-full bg-gradient-to-t from-green-500 to-emerald-400 rounded-t-lg hover:from-green-600 hover:to-emerald-500 transition-all cursor-pointer group relative"
                        style={{ height: `${heightPercent}%` }}
                        title={`${hour._id}:00 - Avg: ${formatNumber(hour.avgGeneration)} kWh, Max: ${formatNumber(hour.maxGeneration)} kWh`}
                      >
                        <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                          Max: {formatNumber(hour.maxGeneration)} kWh
                          <br />
                          Avg: {formatNumber(hour.avgGeneration)} kWh
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 mt-2 font-medium">{hour._id}h</p>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-gray-500 mt-4 text-center">
              Hover over bars to see detailed generation data for each hour
            </p>
          </div>

          {/* Peak by Weather */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">🌤️ Peak Generation by Weather Condition</h3>
            <div className="space-y-3">
              {peakData.peakByWeather?.map((weather, index) => {
                const maxGeneration = peakData.peakByWeather[0]?.maxGeneration || 1;
                const widthPercent = (weather.maxGeneration / maxGeneration) * 100;
                
                return (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-24 text-sm font-medium text-gray-700">{weather._id}</div>
                    <div className="flex-1">
                      <div className="relative h-10 bg-gray-100 rounded-lg overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 flex items-center justify-end px-3 transition-all"
                          style={{ width: `${widthPercent}%` }}
                        >
                          <span className="text-white text-sm font-semibold">
                            {formatNumber(weather.maxGeneration)} kWh
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="w-20 text-right text-sm text-gray-600">
                      {formatNumber(weather.avgEfficiency)}% eff
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Peak Records */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">🏆 Top Peak Generation Records</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Generation</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Peak Power</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Efficiency</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weather</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {peakData.topPeakRecords?.map((record, index) => (
                    <tr key={record._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${
                          index === 0 ? 'bg-yellow-400 text-white' :
                          index === 1 ? 'bg-gray-300 text-gray-700' :
                          index === 2 ? 'bg-orange-400 text-white' :
                          'bg-gray-100 text-gray-600'
                        } font-bold text-sm`}>
                          {index + 1}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium text-gray-900">{record.source?.sourceName}</div>
                          <div className="text-sm text-gray-500">{record.source?.sourceType}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                        {new Date(record.recordDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-semibold text-green-600">{formatNumber(record.energyGenerated)} kWh</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                        {formatNumber(record.peakPower)} kW
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm font-medium text-blue-600">{formatNumber(record.efficiency)}%</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                        {record.weatherCondition}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Alerts Tab */}
      {activeTab === 'alerts' && (
        <div className="space-y-6">
          {/* Threshold Control */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">Alert Threshold Settings</h3>
              <span className="text-sm text-gray-600">Current: {threshold}%</span>
            </div>
            <div className="space-y-2">
              <input
                type="range"
                min="10"
                max="100"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>10%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-3">
              Alert when production falls below {threshold}% of expected capacity
            </p>
          </div>

          {/* Alerts List */}
          {alerts.length === 0 ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
              <span className="text-5xl">✅</span>
              <p className="text-green-700 font-medium mt-3">All systems operating normally!</p>
              <p className="text-green-600 text-sm mt-2">No alerts or issues detected.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert, index) => (
                <div
                  key={index}
                  className={`border rounded-lg p-4 ${getSeverityColor(alert.severity)}`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{getSeverityIcon(alert.severity)}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-lg">{alert.sourceName || 'System Alert'}</h4>
                        <span className="text-xs font-semibold px-2 py-1 rounded uppercase">
                          {getAlertTypeLabel(alert.alertType)}
                        </span>
                      </div>
                      <p className="text-sm mb-2">{alert.message}</p>
                      
                      {alert.currentProduction && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3 text-sm">
                          <div>
                            <p className="font-medium">Current:</p>
                            <p>{alert.currentProduction} kWh</p>
                          </div>
                          <div>
                            <p className="font-medium">Expected:</p>
                            <p>{alert.expectedProduction} kWh</p>
                          </div>
                          <div>
                            <p className="font-medium">Threshold:</p>
                            <p>{alert.threshold} kWh</p>
                          </div>
                        </div>
                      )}
                      
                      {alert.currentEfficiency && (
                        <div className="mt-3 text-sm">
                          <p className="font-medium">Current Efficiency: {alert.currentEfficiency}%</p>
                        </div>
                      )}
                      
                      <p className="text-xs mt-3 opacity-75">
                        {formatDate(alert.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PeakDetectionAlerts;
