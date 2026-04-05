import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Line } from '@ant-design/charts';
import { renewableService } from '../../services/api';

const GenerationForecast = () => {
  const [sources, setSources] = useState([]);
  const [selectedSource, setSelectedSource] = useState('');
  const [period, setPeriod] = useState('7d');
  const [accuracyPeriod, setAccuracyPeriod] = useState('30d');
  const [forecastData, setForecastData] = useState(null);
  const [accuracyData, setAccuracyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSources();
  }, []);

  const fetchSources = async () => {
    try {
      const response = await renewableService.getSources({ status: 'Active' });
      setSources(response.data.data || []);
    } catch (err) {
      console.error('Error fetching sources for forecast filters:', err);
    }
  };

  const fetchForecastInsights = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        period,
        ...(selectedSource ? { sourceId: selectedSource } : {})
      };

      const accuracyParams = {
        period: accuracyPeriod,
        ...(selectedSource ? { sourceId: selectedSource } : {})
      };

      const [forecastResponse, accuracyResponse] = await Promise.all([
        renewableService.getGenerationForecast(params),
        renewableService.getForecastAccuracy(accuracyParams)
      ]);

      setForecastData(forecastResponse.data.data);
      setAccuracyData(accuracyResponse.data.data);
    } catch (err) {
      console.error('Error loading generation forecast:', err);
      setError('Failed to load forecast insights. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [accuracyPeriod, period, selectedSource]);

  useEffect(() => {
    fetchForecastInsights();
  }, [fetchForecastInsights]);

  const chartData = useMemo(() => {
    if (!forecastData) return [];

    const historyPoints = (forecastData.historical || []).map((entry) => ({
      date: entry.date,
      value: entry.actualGeneration,
      series: 'Actual'
    }));

    const forecastPoints = (forecastData.forecast || []).map((entry) => ({
      date: entry.date,
      value: entry.predictedGeneration,
      series: 'Predicted'
    }));

    return [...historyPoints, ...forecastPoints];
  }, [forecastData]);

  const lineConfig = {
    data: chartData,
    xField: 'date',
    yField: 'value',
    seriesField: 'series',
    smooth: true,
    point: {
      size: 3,
      shape: 'circle'
    },
    color: ['#16a34a', '#2563eb'],
    legend: {
      position: 'top'
    },
    tooltip: {
      showCrosshairs: true,
      shared: true
    },
    yAxis: {
      title: {
        text: 'Energy (kWh)'
      }
    },
    xAxis: {
      title: {
        text: 'Date'
      }
    }
  };

  const confidencePercent = forecastData?.confidence
    ? Math.round(forecastData.confidence * 100)
    : 0;

  const trendBadgeStyles = {
    up: 'bg-emerald-100 text-emerald-700',
    down: 'bg-rose-100 text-rose-700',
    flat: 'bg-slate-100 text-slate-700'
  };

  const hasInsufficientDataMessage = !!forecastData?.message;

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
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">🔮 Generation Forecast</h2>
          <p className="text-gray-600 text-sm mt-1">
            Predicted vs actual generation with confidence and model accuracy
          </p>
        </div>

        <button
          onClick={fetchForecastInsights}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          Refresh Forecast
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">All Active Sources</option>
              {sources.map((source) => (
                <option key={source._id} value={source._id}>
                  {source.sourceName} ({source.sourceType})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Forecast Horizon</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="7d">Next 7 Days</option>
              <option value="30d">Next 30 Days</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Accuracy Window</label>
            <select
              value={accuracyPeriod}
              onChange={(e) => setAccuracyPeriod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
          </div>
        </div>
      </div>

      {hasInsufficientDataMessage ? (
        <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-6 text-yellow-800">
          <p className="font-semibold">Not enough historical data for forecasting</p>
          <p className="text-sm mt-1">{forecastData.message}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-lg p-5 border-l-4 border-emerald-500">
              <p className="text-sm text-gray-600">Model</p>
              <p className="text-xl font-bold text-gray-800 mt-1">{forecastData?.model || 'N/A'}</p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-5 border-l-4 border-blue-500">
              <p className="text-sm text-gray-600">Confidence</p>
              <p className="text-xl font-bold text-blue-700 mt-1">{confidencePercent}%</p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-5 border-l-4 border-indigo-500">
              <p className="text-sm text-gray-600">MAPE</p>
              <p className="text-xl font-bold text-indigo-700 mt-1">
                {accuracyData?.mape === null || accuracyData?.mape === undefined
                  ? 'N/A'
                  : `${accuracyData.mape}%`}
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-5 border-l-4 border-purple-500">
              <p className="text-sm text-gray-600">RMSE</p>
              <p className="text-xl font-bold text-purple-700 mt-1">
                {accuracyData?.rmse === null || accuracyData?.rmse === undefined
                  ? 'N/A'
                  : accuracyData.rmse}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <h3 className="text-lg font-bold text-gray-800">Predicted vs Actual Generation</h3>
              <span className={`px-2 py-1 text-xs rounded-full ${trendBadgeStyles[forecastData?.baseline?.trend] || trendBadgeStyles.flat}`}>
                Trend: {forecastData?.baseline?.trend || 'flat'}
              </span>
              <span className="px-2 py-1 text-xs rounded-full bg-slate-100 text-slate-700">
                Avg Last 30 Days: {forecastData?.baseline?.avgLast30Days || 0} kWh
              </span>
            </div>

            {chartData.length > 0 ? (
              <Line {...lineConfig} />
            ) : (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 text-center text-slate-600">
                No chart data available.
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Upcoming Forecast Points</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left text-xs uppercase text-gray-500 font-medium px-4 py-3">Date</th>
                    <th className="text-left text-xs uppercase text-gray-500 font-medium px-4 py-3">Predicted (kWh)</th>
                    <th className="text-left text-xs uppercase text-gray-500 font-medium px-4 py-3">Lower Bound</th>
                    <th className="text-left text-xs uppercase text-gray-500 font-medium px-4 py-3">Upper Bound</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {(forecastData?.forecast || []).map((entry) => (
                    <tr key={entry.date} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-700">{entry.date}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-blue-700">{entry.predictedGeneration}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{entry.lowerBound}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{entry.upperBound}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default GenerationForecast;
