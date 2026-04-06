import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Line } from '@ant-design/charts';
import { renewableService } from '../../services/api';

const VarianceDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sources, setSources] = useState([]);

  const [period, setPeriod] = useState('30d');
  const [sourceId, setSourceId] = useState('');
  const [threshold, setThreshold] = useState(15);
  const [months, setMonths] = useState(12);

  const [varianceData, setVarianceData] = useState(null);
  const [trendData, setTrendData] = useState([]);

  const fetchVariance = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        period,
        underperformingThreshold: threshold,
        ...(sourceId ? { sourceId } : {})
      };

      const trendParams = {
        months,
        underperformingThreshold: threshold,
        ...(sourceId ? { sourceId } : {})
      };

      const [sourcesResponse, varianceResponse, trendResponse] = await Promise.all([
        renewableService.getSources({ status: 'Active' }),
        renewableService.getVarianceAnalytics(params),
        renewableService.getVarianceTrend(trendParams)
      ]);

      setSources(sourcesResponse.data.data || []);
      setVarianceData(varianceResponse.data.data || null);
      setTrendData(trendResponse.data.data?.trend || []);
    } catch (err) {
      console.error('Error loading variance dashboard:', err);
      setError('Failed to load variance analytics. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [months, period, sourceId, threshold]);

  useEffect(() => {
    fetchVariance();
  }, [fetchVariance]);

  const formatNum = (value) => Number(value || 0).toFixed(2);

  const getStatusChip = (status) => {
    if (status === 'underperforming') {
      return 'bg-red-100 text-red-700 border-red-300';
    }
    if (status === 'overperforming') {
      return 'bg-emerald-100 text-emerald-700 border-emerald-300';
    }
    return 'bg-blue-100 text-blue-700 border-blue-300';
  };

  const trendChartSeries = useMemo(() => {
    const series = [];

    trendData.forEach((item) => {
      series.push({
        month: item.month,
        metric: 'Variance %',
        value: item.variancePercent
      });
    });

    return series;
  }, [trendData]);

  const trendConfig = {
    data: trendChartSeries,
    xField: 'month',
    yField: 'value',
    seriesField: 'metric',
    smooth: true,
    color: ['#f59e0b'],
    yAxis: {
      title: {
        text: 'Variance (%)'
      }
    },
    xAxis: {
      title: {
        text: 'Month'
      }
    },
    tooltip: {
      formatter: (datum) => ({
        name: datum.metric,
        value: `${Number(datum.value).toFixed(2)}%`
      })
    }
  };

  const handleExportCSV = () => {
    if (!varianceData?.bySource?.length) {
      alert('No variance rows available to export.');
      return;
    }

    const header = ['Source Name', 'Source Type', 'Expected Energy', 'Actual Energy', 'Variance', 'Variance Percent', 'Status'];
    const rows = varianceData.bySource.map((row) => [
      row.sourceName,
      row.sourceType || 'N/A',
      row.expectedEnergy,
      row.actualEnergy,
      row.variance,
      row.variancePercent,
      row.status
    ]);

    const csv = [header, ...rows]
      .map((line) => line.map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `variance-dashboard-${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">📉 Expected vs Actual Variance</h2>
          <p className="text-gray-600 text-sm mt-1">Compare expected production with actual output and identify underperforming assets.</p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            Export CSV
          </button>
          <button
            onClick={fetchVariance}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="1y">Last 1 Year</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Source Filter</label>
            <select
              value={sourceId}
              onChange={(e) => setSourceId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">All Sources</option>
              {sources.map((source) => (
                <option key={source._id} value={source._id}>{source.sourceName}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Underperforming Threshold (%)</label>
            <input
              type="number"
              min="1"
              max="100"
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value) || 15)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Trend Window (months)</label>
            <select
              value={months}
              onChange={(e) => setMonths(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value={6}>6</option>
              <option value={12}>12</option>
              <option value={24}>24</option>
            </select>
          </div>
        </div>

        <p
          className="text-xs text-gray-500 mt-3"
          title="Expected energy = Estimated Annual Production × (Period Days / 365)"
        >
          Formula: Expected energy = Estimated annual production × (period days / 365)
        </p>
      </div>

      {varianceData && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl shadow p-5 border-l-4 border-blue-500">
              <p className="text-sm text-gray-600">Expected Energy</p>
              <p className="text-2xl font-bold text-blue-700">{formatNum(varianceData.overall?.expectedEnergy)} kWh</p>
            </div>
            <div className="bg-white rounded-xl shadow p-5 border-l-4 border-emerald-500">
              <p className="text-sm text-gray-600">Actual Energy</p>
              <p className="text-2xl font-bold text-emerald-700">{formatNum(varianceData.overall?.actualEnergy)} kWh</p>
            </div>
            <div className="bg-white rounded-xl shadow p-5 border-l-4 border-amber-500">
              <p className="text-sm text-gray-600">Variance %</p>
              <p className="text-2xl font-bold text-amber-700">{formatNum(varianceData.overall?.variancePercent)}%</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-3">Monthly Variance Trend</h3>
            {trendChartSeries.length > 0 ? (
              <Line {...trendConfig} />
            ) : (
              <p className="text-sm text-gray-500">No trend data available for selected filters.</p>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-3">Source Comparison</h3>
            {varianceData.bySource?.length ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expected</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actual</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Variance %</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {varianceData.bySource.map((row) => (
                      <tr key={row.sourceId} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-700">
                          <p className="font-semibold text-gray-800">{row.sourceName}</p>
                          <p className="text-xs text-gray-500">{row.sourceType || 'N/A'}</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">{formatNum(row.expectedEnergy)} kWh</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{formatNum(row.actualEnergy)} kWh</td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-800">{formatNum(row.variancePercent)}%</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full border ${getStatusChip(row.status)}`}>
                            {row.status.replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No source-level variance data available.</p>
            )}
          </div>

          {varianceData.insights?.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-3">Insights</h3>
              <ul className="space-y-2">
                {varianceData.insights.map((insight, index) => (
                  <li key={index} className="text-sm text-gray-700">• {insight}</li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default VarianceDashboard;
