import React, { useCallback, useState, useEffect } from 'react';
import { renewableService } from '../../services/api';

const EnergyIndependence = () => {
  const [independenceData, setIndependenceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('30d');

  const fetchIndependenceData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await renewableService.getEnergyIndependence({ period });
      setIndependenceData(response.data.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching independence data:', err);
      setError('Failed to load energy independence data');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchIndependenceData();
  }, [fetchIndependenceData]);

  const getIndependenceColor = (level) => {
    switch (level) {
      case 'fully_independent':
        return 'from-green-600 to-emerald-500';
      case 'highly_independent':
        return 'from-blue-600 to-cyan-500';
      case 'moderately_independent':
        return 'from-yellow-500 to-orange-500';
      case 'partially_independent':
        return 'from-orange-500 to-red-500';
      case 'grid_dependent':
        return 'from-red-600 to-pink-500';
      default:
        return 'from-gray-600 to-gray-500';
    }
  };

  const getIndependenceLabel = (level) => {
    const labels = {
      fully_independent: 'Fully Independent',
      highly_independent: 'Highly Independent',
      moderately_independent: 'Moderately Independent',
      partially_independent: 'Partially Independent',
      grid_dependent: 'Grid Dependent'
    };
    return labels[level] || 'Unknown';
  };

  const getIndependenceIcon = (level) => {
    const icons = {
      fully_independent: '🌟',
      highly_independent: '⭐',
      moderately_independent: '🔆',
      partially_independent: '⚡',
      grid_dependent: '🔌'
    };
    return icons[level] || '📊';
  };

  const formatNumber = (num) => {
    if (!num) return '0';
    return num.toFixed(2);
  };

  const getPeriodLabel = (period) => {
    const labels = {
      '7d': 'Last 7 Days',
      '30d': 'Last 30 Days',
      '90d': 'Last 90 Days',
      '1y': 'Last Year'
    };
    return labels[period] || period;
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
          <h2 className="text-2xl font-bold text-gray-800">🌍 Energy Independence Analytics</h2>
          <p className="text-gray-600 text-sm mt-1">Monitor your self-sufficiency and grid dependency</p>
        </div>
        
        <div className="flex gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="1y">Last Year</option>
          </select>
        </div>
      </div>

      {independenceData && (
        <>
          {/* Independence Level Banner */}
          <div className={`bg-gradient-to-r ${getIndependenceColor(independenceData.independenceLevel)} rounded-xl p-8 text-white shadow-xl`}>
            <div className="text-center">
              <span className="text-6xl mb-4 block">{getIndependenceIcon(independenceData.independenceLevel)}</span>
              <h3 className="text-3xl font-bold mb-2">
                {getIndependenceLabel(independenceData.independenceLevel)}
              </h3>
              <p className="text-xl opacity-90">
                {formatNumber(independenceData.selfSufficiencyRatio)}% Self-Sufficient
              </p>
              <p className="text-sm opacity-75 mt-2">{getPeriodLabel(period)}</p>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
              <p className="text-gray-600 text-sm font-medium">Energy Generated</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">
                {formatNumber(independenceData.totalGenerated)}
                <span className="text-lg ml-1">kWh</span>
              </p>
              <p className="text-green-600 text-sm mt-1">From renewable sources</p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
              <p className="text-gray-600 text-sm font-medium">Energy Consumed</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">
                {formatNumber(independenceData.totalConsumed)}
                <span className="text-lg ml-1">kWh</span>
              </p>
              <p className="text-blue-600 text-sm mt-1">Total usage</p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
              <p className="text-gray-600 text-sm font-medium">Grid Dependency</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">
                {formatNumber(independenceData.gridDependency)}
                <span className="text-lg ml-1">%</span>
              </p>
              <p className="text-yellow-600 text-sm mt-1">From grid</p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
              <p className="text-gray-600 text-sm font-medium">Average Efficiency</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">
                {formatNumber(independenceData.averageEfficiency)}
                <span className="text-lg ml-1">%</span>
              </p>
              <p className="text-purple-600 text-sm mt-1">System performance</p>
            </div>
          </div>

          {/* Energy Balance */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-6">⚖️ Energy Balance</h3>
            
            <div className="space-y-6">
              {/* Self-Sufficiency Bar */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-medium text-gray-700">Self-Sufficiency Ratio</span>
                  <span className="text-lg font-bold text-green-600">
                    {formatNumber(independenceData.selfSufficiencyRatio)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-8 overflow-hidden relative">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-500 flex items-center justify-center text-white text-sm font-semibold"
                    style={{ width: `${Math.min(independenceData.selfSufficiencyRatio, 100)}%` }}
                  >
                    {independenceData.selfSufficiencyRatio >= 20 && 'Renewable'}
                  </div>
                  {independenceData.gridDependency > 0 && (
                    <div className="absolute top-0 right-0 h-full flex items-center justify-center text-gray-600 text-sm font-semibold pr-3">
                      Grid
                    </div>
                  )}
                </div>
              </div>

              {/* Excess or Deficit */}
              {independenceData.excessEnergy > 0 ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">✨</span>
                    <div className="flex-1">
                      <p className="font-semibold text-green-800">Excess Energy Available</p>
                      <p className="text-2xl font-bold text-green-600 mt-1">
                        {formatNumber(independenceData.excessEnergy)} kWh
                      </p>
                      <p className="text-sm text-green-700 mt-1">
                        You're generating more than you consume! Consider battery storage or selling back to grid.
                      </p>
                    </div>
                  </div>
                </div>
              ) : independenceData.energyDeficit > 0 ? (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">⚠️</span>
                    <div className="flex-1">
                      <p className="font-semibold text-orange-800">Energy Deficit</p>
                      <p className="text-2xl font-bold text-orange-600 mt-1">
                        {formatNumber(independenceData.energyDeficit)} kWh
                      </p>
                      <p className="text-sm text-orange-700 mt-1">
                        You need additional {formatNumber(independenceData.energyDeficit)} kWh from the grid to meet your consumption.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">⚡</span>
                    <div className="flex-1">
                      <p className="font-semibold text-blue-800">Perfect Balance</p>
                      <p className="text-sm text-blue-700 mt-1">
                        Your generation matches your consumption perfectly!
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Environmental & Financial Impact */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span>🌱</span>
                Environmental Impact
              </h3>
              <div className="space-y-4">
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Carbon Offset</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">
                    {formatNumber(independenceData.carbonOffset)} kg CO₂
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Equivalent to planting {Math.floor(independenceData.carbonOffset / 20)} trees
                  </p>
                </div>
                <div className="text-sm text-gray-600">
                  Your renewable energy has prevented{' '}
                  <span className="font-semibold text-green-600">
                    {formatNumber(independenceData.carbonOffset)} kg
                  </span>{' '}
                  of CO₂ emissions from entering the atmosphere.
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span>💰</span>
                Financial Savings
              </h3>
              <div className="space-y-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Total Savings</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">
                    ${formatNumber(independenceData.costSavings)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {getPeriodLabel(period)}
                  </p>
                </div>
                <div className="text-sm text-gray-600">
                  By generating your own energy, you've saved{' '}
                  <span className="font-semibold text-blue-600">
                    ${formatNumber(independenceData.costSavings)}
                  </span>{' '}
                  on electricity bills.
                </div>
              </div>
            </div>
          </div>

          {/* Daily Analysis Chart */}
          {independenceData.dailyAnalysis && independenceData.dailyAnalysis.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">📅 Daily Generation Trend</h3>
              <div className="flex items-end justify-between gap-1 h-48">
                {independenceData.dailyAnalysis.map((day, index) => {
                  const maxGeneration = Math.max(...independenceData.dailyAnalysis.map(d => d.generated));
                  const heightPercent = (day.generated / maxGeneration) * 100;
                  
                  return (
                    <div
                      key={index}
                      className="flex-1 bg-gradient-to-t from-green-500 to-emerald-400 rounded-t hover:from-green-600 hover:to-emerald-500 transition-all cursor-pointer relative group"
                      style={{ height: `${heightPercent}%` }}
                      title={`${new Date(day._id).toLocaleDateString()}: ${formatNumber(day.generated)} kWh`}
                    >
                      <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                        {new Date(day._id).toLocaleDateString()}
                        <br />
                        {formatNumber(day.generated)} kWh
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-3">
                <span>{independenceData.dailyAnalysis[0]?._id}</span>
                <span>Daily Generation</span>
                <span>{independenceData.dailyAnalysis[independenceData.dailyAnalysis.length - 1]?._id}</span>
              </div>
            </div>
          )}

          {/* Recommendations */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white shadow-lg">
            <h3 className="text-lg font-bold mb-4">💡 Quick Tips to Improve Independence</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {independenceData.selfSufficiencyRatio < 50 && (
                <div className="bg-white bg-opacity-20 rounded-lg p-4">
                  <p className="font-semibold mb-2">📈 Increase Generation</p>
                  <p className="text-sm opacity-90">
                    Consider adding more renewable sources or optimizing existing ones
                  </p>
                </div>
              )}
              {independenceData.gridDependency > 50 && (
                <div className="bg-white bg-opacity-20 rounded-lg p-4">
                  <p className="font-semibold mb-2">🔋 Add Energy Storage</p>
                  <p className="text-sm opacity-90">
                    Battery storage can help reduce grid dependency
                  </p>
                </div>
              )}
              {independenceData.excessEnergy > 0 && (
                <div className="bg-white bg-opacity-20 rounded-lg p-4">
                  <p className="font-semibold mb-2">💸 Monetize Excess</p>
                  <p className="text-sm opacity-90">
                    Consider selling excess energy back to the grid
                  </p>
                </div>
              )}
              {independenceData.averageEfficiency < 75 && (
                <div className="bg-white bg-opacity-20 rounded-lg p-4">
                  <p className="font-semibold mb-2">🔧 Optimize Efficiency</p>
                  <p className="text-sm opacity-90">
                    Schedule maintenance to improve system efficiency
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default EnergyIndependence;
