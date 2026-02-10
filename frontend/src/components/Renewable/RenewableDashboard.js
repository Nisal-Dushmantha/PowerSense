import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { renewableService } from '../../services/api';

const RenewableDashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('all');

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [dashboardRes, statsRes] = await Promise.all([
        renewableService.getDashboard(),
        renewableService.getStatistics(getTimeRangeParams())
      ]);
      
      setDashboard(dashboardRes.data.data);
      setStats(statsRes.data.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch dashboard data');
      console.error('Error fetching dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTimeRangeParams = () => {
    const params = {};
    const now = new Date();
    
    switch (timeRange) {
      case '7days':
        params.startDate = new Date(now.setDate(now.getDate() - 7)).toISOString();
        break;
      case '30days':
        params.startDate = new Date(now.setDate(now.getDate() - 30)).toISOString();
        break;
      case '90days':
        params.startDate = new Date(now.setDate(now.getDate() - 90)).toISOString();
        break;
      default:
        break;
    }
    
    return params;
  };

  const formatNumber = (num) => {
    if (!num) return '0';
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(num);
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'Rs. 0';
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
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

  const getSourceTypeColor = (type) => {
    const colors = {
      Solar: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      Wind: 'bg-blue-100 text-blue-800 border-blue-200',
      Hydro: 'bg-cyan-100 text-cyan-800 border-cyan-200',
      Biomass: 'bg-green-100 text-green-800 border-green-200',
      Geothermal: 'bg-orange-100 text-orange-800 border-orange-200',
      Other: 'bg-purple-100 text-purple-800 border-purple-200'
    };
    return colors[type] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-green-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg mb-6">
        <div className="flex items-center">
          <span className="text-2xl mr-3">⚠️</span>
          <div>
            <p className="font-semibold">{error}</p>
            <button 
              onClick={fetchDashboardData}
              className="mt-2 text-red-600 hover:text-red-800 underline text-sm"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 flex items-center">
            <span className="text-5xl mr-3">🌱</span>
            Renewable Energy Dashboard
          </h1>
          <p className="text-gray-600 mt-2">Monitor your sustainable energy production</p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/renewable/sources"
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            ⚡ Manage Sources
          </Link>
          <Link
            to="/renewable/records/new"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            📊 Add Record
          </Link>
        </div>
      </div>

      {/* Time Range Filter */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center gap-4">
          <span className="text-gray-700 font-medium">Time Range:</span>
          <div className="flex gap-2">
            {[
              { value: 'all', label: 'All Time' },
              { value: '7days', label: 'Last 7 Days' },
              { value: '30days', label: 'Last 30 Days' },
              { value: '90days', label: 'Last 90 Days' }
            ].map(range => (
              <button
                key={range.value}
                onClick={() => setTimeRange(range.value)}
                className={`px-4 py-2 rounded-lg transition-all ${
                  timeRange === range.value
                    ? 'bg-green-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Active Sources */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white transform transition-all hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Active Sources</p>
              <p className="text-4xl font-bold mt-2">{dashboard?.sources?.active || 0}</p>
              <p className="text-green-100 text-xs mt-1">of {dashboard?.sources?.total || 0} total</p>
            </div>
            <div className="text-6xl opacity-80">⚡</div>
          </div>
        </div>

        {/* Total Energy */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white transform transition-all hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Energy Generated</p>
              <p className="text-4xl font-bold mt-2">{formatNumber(dashboard?.allTime?.totalEnergy || 0)}</p>
              <p className="text-blue-100 text-xs mt-1">kWh</p>
            </div>
            <div className="text-6xl opacity-80">🔋</div>
          </div>
        </div>

        {/* Carbon Offset */}
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white transform transition-all hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm font-medium">Carbon Offset</p>
              <p className="text-4xl font-bold mt-2">{formatNumber(dashboard?.allTime?.totalCarbonOffset || 0)}</p>
              <p className="text-emerald-100 text-xs mt-1">kg CO₂</p>
            </div>
            <div className="text-6xl opacity-80">🌍</div>
          </div>
        </div>

        {/* Cost Savings */}
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg p-6 text-white transform transition-all hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100 text-sm font-medium">Cost Savings</p>
              <p className="text-3xl font-bold mt-2">{formatCurrency(dashboard?.allTime?.totalCostSavings || 0)}</p>
              <p className="text-amber-100 text-xs mt-1">All time</p>
            </div>
            <div className="text-6xl opacity-80">💰</div>
          </div>
        </div>
      </div>

      {/* Last 30 Days Performance */}
      {dashboard?.last30Days && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl shadow-md p-6 border border-purple-100">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
            <span className="text-3xl mr-2">📈</span>
            Last 30 Days Performance
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg p-4 shadow">
              <p className="text-gray-600 text-sm">Energy Generated</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">
                {formatNumber(dashboard.last30Days.totalEnergy)} kWh
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow">
              <p className="text-gray-600 text-sm">Average Efficiency</p>
              <p className="text-3xl font-bold text-pink-600 mt-2">
                {formatNumber(dashboard.last30Days.avgEfficiency)}%
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow">
              <p className="text-gray-600 text-sm">Carbon Offset</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {formatNumber(dashboard.last30Days.totalCarbonOffset)} kg
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Energy by Source Type */}
      {stats?.energyByType && stats.energyByType.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <span className="text-3xl mr-2">🔌</span>
            Energy Production by Source Type
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.energyByType.map((type, index) => (
              <div 
                key={index}
                className={`border-2 rounded-lg p-4 ${getSourceTypeColor(type._id)}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-4xl mr-3">{getSourceTypeIcon(type._id)}</span>
                    <div>
                      <p className="font-bold text-lg">{type._id}</p>
                      <p className="text-sm opacity-75">{type.recordCount} records</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{formatNumber(type.totalEnergy)}</p>
                    <p className="text-xs opacity-75">kWh</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Performing Sources */}
      {stats?.topSources && stats.topSources.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <span className="text-3xl mr-2">🏆</span>
            Top Performing Sources
          </h2>
          <div className="space-y-4">
            {stats.topSources.map((source, index) => (
              <div 
                key={source._id}
                className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full text-white font-bold text-xl">
                    #{index + 1}
                  </div>
                  <div>
                    <p className="font-bold text-lg text-gray-800">{source.sourceName}</p>
                    <p className="text-sm text-gray-600 flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs ${getSourceTypeColor(source.sourceType)}`}>
                        {getSourceTypeIcon(source.sourceType)} {source.sourceType}
                      </span>
                      <span>{source.recordCount} records</span>
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">{formatNumber(source.totalEnergy)} kWh</p>
                  <p className="text-sm text-gray-600">Avg Efficiency: {formatNumber(source.avgEfficiency)}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Monthly Trends */}
      {stats?.monthlyTrends && stats.monthlyTrends.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <span className="text-3xl mr-2">📊</span>
            Monthly Energy Trends
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Energy (kWh)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Carbon Offset (kg)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Efficiency</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Records</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {stats.monthlyTrends.map((trend, index) => {
                  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                  return (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {monthNames[trend._id.month - 1]} {trend._id.year}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                        {formatNumber(trend.totalEnergy)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">
                        {formatNumber(trend.totalCarbonOffset)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-semibold">
                        {formatNumber(trend.avgEfficiency)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {trend.recordCount}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Latest Records */}
      {dashboard?.latestRecords && dashboard.latestRecords.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center">
              <span className="text-3xl mr-2">📝</span>
              Latest Energy Records
            </h2>
            <Link 
              to="/renewable/records"
              className="text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              View All →
            </Link>
          </div>
          <div className="space-y-3">
            {dashboard.latestRecords.map((record) => (
              <div 
                key={record._id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`px-3 py-2 rounded-lg ${getSourceTypeColor(record.source?.sourceType)}`}>
                    <span className="text-2xl">{getSourceTypeIcon(record.source?.sourceType)}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{record.source?.sourceName}</p>
                    <p className="text-sm text-gray-600">{formatDate(record.recordDate)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-gray-800">{formatNumber(record.energyGenerated)} kWh</p>
                  {record.efficiency && (
                    <p className="text-sm text-gray-600">Efficiency: {formatNumber(record.efficiency)}%</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {(!dashboard || dashboard.records === 0) && (
        <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-xl shadow-lg p-12 text-center border-2 border-dashed border-gray-300">
          <div className="text-8xl mb-4">🌱</div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">Start Your Renewable Energy Journey!</h3>
          <p className="text-gray-600 mb-6">Add your first renewable energy source and start tracking your impact.</p>
          <div className="flex gap-4 justify-center">
            <Link
              to="/renewable/sources"
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Add Energy Source
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default RenewableDashboard;
