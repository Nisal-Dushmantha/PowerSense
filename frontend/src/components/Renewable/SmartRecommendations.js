import React, { useState, useEffect } from 'react';
import { renewableService } from '../../services/api';

const SmartRecommendations = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const response = await renewableService.getOptimizationRecommendations();
      setRecommendations(response.data.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      setError('Failed to load optimization recommendations');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 border-red-300 text-red-800';
      case 'medium':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'low':
        return 'bg-blue-100 border-blue-300 text-blue-800';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const getPriorityBadge = (priority) => {
    const colors = {
      high: 'bg-red-500',
      medium: 'bg-yellow-500',
      low: 'bg-blue-500'
    };
    return colors[priority] || 'bg-gray-500';
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high':
        return '🔴';
      case 'medium':
        return '🟡';
      case 'low':
        return '🔵';
      default:
        return '⚪';
    }
  };

  const getCategoryIcon = (category) => {
    const icons = {
      efficiency: '⚡',
      utilization: '📊',
      optimization: '🎯',
      maintenance: '🔧',
      expansion: '📈',
      performance: '🚀'
    };
    return icons[category] || '💡';
  };

  const getCategoryLabel = (category) => {
    const labels = {
      efficiency: 'Efficiency',
      utilization: 'Utilization',
      optimization: 'Optimization',
      maintenance: 'Maintenance',
      expansion: 'Expansion',
      performance: 'Performance'
    };
    return labels[category] || category;
  };

  const getImpactColor = (impact) => {
    switch (impact) {
      case 'high':
        return 'text-green-600';
      case 'medium':
        return 'text-blue-600';
      case 'low':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  const filteredRecommendations = recommendations.filter(rec => {
    if (filter === 'all') return true;
    if (filter === 'source') return rec.sourceId;
    if (filter === 'general') return !rec.sourceId;
    return rec.priority === filter;
  });

  const toggleExpand = (index) => {
    setExpandedId(expandedId === index ? null : index);
  };

  // Group recommendations by priority
  const groupedByPriority = {
    high: filteredRecommendations.filter(r => r.priority === 'high'),
    medium: filteredRecommendations.filter(r => r.priority === 'medium'),
    low: filteredRecommendations.filter(r => r.priority === 'low')
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
          <h2 className="text-2xl font-bold text-gray-800">🤖 Smart Optimization Recommendations</h2>
          <p className="text-gray-600 text-sm mt-1">AI-powered insights to maximize your renewable energy efficiency</p>
        </div>
        
        <button
          onClick={fetchRecommendations}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
        >
          <span>🔄</span>
          Refresh
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-xl shadow-lg p-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All ({recommendations.length})
          </button>
          <button
            onClick={() => setFilter('high')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'high'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            🔴 High Priority ({groupedByPriority.high.length})
          </button>
          <button
            onClick={() => setFilter('medium')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'medium'
                ? 'bg-yellow-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            🟡 Medium Priority ({groupedByPriority.medium.length})
          </button>
          <button
            onClick={() => setFilter('low')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'low'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            🔵 Low Priority ({groupedByPriority.low.length})
          </button>
          <button
            onClick={() => setFilter('source')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'source'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Source-Specific
          </button>
          <button
            onClick={() => setFilter('general')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'general'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            General
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      {recommendations.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-red-500 to-pink-500 rounded-xl p-6 text-white shadow-lg">
            <p className="text-red-100 text-sm">High Priority</p>
            <p className="text-4xl font-bold mt-2">{groupedByPriority.high.length}</p>
            <p className="text-red-100 text-xs mt-1">Immediate action recommended</p>
          </div>
          
          <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl p-6 text-white shadow-lg">
            <p className="text-yellow-100 text-sm">Medium Priority</p>
            <p className="text-4xl font-bold mt-2">{groupedByPriority.medium.length}</p>
            <p className="text-yellow-100 text-xs mt-1">Should be addressed soon</p>
          </div>
          
          <div className="bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl p-6 text-white shadow-lg">
            <p className="text-blue-100 text-sm">Low Priority</p>
            <p className="text-4xl font-bold mt-2">{groupedByPriority.low.length}</p>
            <p className="text-blue-100 text-xs mt-1">Optional improvements</p>
          </div>
        </div>
      )}

      {/* Recommendations List */}
      {filteredRecommendations.length === 0 ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
          <span className="text-5xl mb-4 block">🎉</span>
          <p className="text-green-700 font-medium text-lg">Excellent! No recommendations at this time.</p>
          <p className="text-green-600 text-sm mt-2">
            Your renewable energy system is operating optimally. Keep up the great work!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRecommendations.map((rec, index) => (
            <div
              key={index}
              className={`border-2 rounded-xl overflow-hidden transition-all ${getPriorityColor(rec.priority)}`}
            >
              {/* Recommendation Header */}
              <div
                className="p-4 cursor-pointer hover:bg-opacity-50 transition-all"
                onClick={() => toggleExpand(index)}
              >
                <div className="flex items-start gap-4">
                  <span className="text-4xl flex-shrink-0">{getCategoryIcon(rec.category)}</span>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{getPriorityIcon(rec.priority)}</span>
                          <h3 className="font-bold text-lg">{rec.title}</h3>
                        </div>
                        
                        {rec.sourceName && (
                          <p className="text-sm font-medium mb-1">
                            📍 {rec.sourceName} ({rec.sourceType})
                          </p>
                        )}
                        
                        <p className="text-sm">{rec.description}</p>
                      </div>
                      
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <span className={`${getPriorityBadge(rec.priority)} text-white text-xs px-3 py-1 rounded-full font-semibold uppercase`}>
                          {rec.priority}
                        </span>
                        <span className="text-xs bg-white bg-opacity-50 px-2 py-1 rounded-full font-medium">
                          {getCategoryLabel(rec.category)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <button className="flex-shrink-0 text-2xl transform transition-transform">
                    {expandedId === index ? '▼' : '▶'}
                  </button>
                </div>
              </div>

              {/* Expanded Content */}
              {expandedId === index && (
                <div className="bg-white bg-opacity-70 p-6 border-t-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Suggestions */}
                    <div>
                      <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                        <span>✅</span>
                        Action Items
                      </h4>
                      <ul className="space-y-2">
                        {rec.suggestions?.map((suggestion, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <span className="text-green-600 mt-0.5">•</span>
                            <span className="text-gray-700">{suggestion}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Impact & Improvement */}
                    <div>
                      <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                        <span>📊</span>
                        Expected Impact
                      </h4>
                      <div className="space-y-3">
                        <div className="bg-white rounded-lg p-3 border border-gray-200">
                          <p className="text-xs text-gray-600 mb-1">Potential Improvement</p>
                          <p className="font-semibold text-gray-800">{rec.potentialImprovement}</p>
                        </div>
                        
                        <div className="bg-white rounded-lg p-3 border border-gray-200">
                          <p className="text-xs text-gray-600 mb-1">Estimated Impact</p>
                          <p className={`font-semibold capitalize ${getImpactColor(rec.estimatedImpact)}`}>
                            {rec.estimatedImpact}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end">
                    <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2">
                      <span>✔️</span>
                      Mark as Reviewed
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Information Footer */}
      {recommendations.length > 0 && (
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white shadow-lg">
          <h3 className="font-bold text-lg mb-3">💡 About These Recommendations</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="bg-white bg-opacity-20 rounded-lg p-3">
              <p className="font-semibold mb-1">AI-Powered Analysis</p>
              <p className="opacity-90">
                Our system analyzes your energy generation patterns, efficiency metrics, and historical data to provide personalized recommendations.
              </p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-3">
              <p className="font-semibold mb-1">Continuous Updates</p>
              <p className="opacity-90">
                Recommendations are updated regularly based on your latest energy data. Check back frequently for new insights.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartRecommendations;
