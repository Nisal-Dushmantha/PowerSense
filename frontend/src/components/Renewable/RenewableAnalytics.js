import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import GenerationMeters from './GenerationMeters';
import PeakDetectionAlerts from './PeakDetectionAlerts';
import EnergyIndependence from './EnergyIndependence';
import SmartRecommendations from './SmartRecommendations';
import GenerationForecast from './GenerationForecast';

const RenewableAnalytics = () => {
  const [activeTab, setActiveTab] = useState('meters');

  const tabs = [
    { id: 'meters', name: '⚡ Generation Meters', icon: '⚡' },
    { id: 'forecast', name: '🔮 Forecast', icon: '🔮' },
    { id: 'peaks', name: '📈 Peak & Alerts', icon: '📈' },
    { id: 'independence', name: '🌍 Energy Independence', icon: '🌍' },
    { id: 'recommendations', name: '🤖 Smart Recommendations', icon: '🤖' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">🌟 Renewable Energy Analytics</h1>
          <p className="text-gray-600 mt-1">Advanced monitoring and optimization for your renewable energy systems</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <Link
            to="/renewable"
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
            </svg>
            Back to Records
          </Link>
          <Link
            to="/renewable/sources"
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M13 3h-2v10h2V3zm4.83 2.17l-1.42 1.42C17.99 7.86 19 9.81 19 12c0 3.87-3.13 7-7 7s-7-3.13-7-7c0-2.19 1.01-4.14 2.58-5.42L6.17 5.17C4.23 6.82 3 9.26 3 12c0 4.97 4.03 9 9 9s9-4.03 9-9c0-2.74-1.23-5.18-3.17-6.83z"/>
            </svg>
            Manage Sources
          </Link>
        </div>
      </div>

      {/* Quick Stats Banner */}
      <div className="bg-gradient-to-r from-green-600 via-emerald-500 to-teal-500 rounded-xl shadow-xl p-6 text-white">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-4xl mb-2">⚡</div>
            <div className="text-2xl font-bold">Real-Time</div>
            <div className="text-green-100 text-sm">Generation Monitoring</div>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-2">📊</div>
            <div className="text-2xl font-bold">AI-Powered</div>
            <div className="text-green-100 text-sm">Peak Detection</div>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-2">🌍</div>
            <div className="text-2xl font-bold">Energy</div>
            <div className="text-green-100 text-sm">Independence Tracking</div>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-2">🤖</div>
            <div className="text-2xl font-bold">Smart</div>
            <div className="text-green-100 text-sm">Optimization Tips</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="border-b border-gray-200 overflow-x-auto">
          <nav className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-max px-6 py-4 text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-green-600 text-white border-b-4 border-green-700'
                    : 'bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                }`}
              >
                <span className="text-xl mr-2">{tab.icon}</span>
                <span className="hidden sm:inline">{tab.name.split(' ').slice(1).join(' ')}</span>
                <span className="sm:hidden">{tab.icon}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'meters' && <GenerationMeters />}
          {activeTab === 'forecast' && <GenerationForecast />}
          {activeTab === 'peaks' && <PeakDetectionAlerts />}
          {activeTab === 'independence' && <EnergyIndependence />}
          {activeTab === 'recommendations' && <SmartRecommendations />}
        </div>
      </div>
    </div>
  );
};

export default RenewableAnalytics;
