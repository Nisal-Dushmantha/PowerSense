import React, { useState, useEffect } from 'react';
import { billService } from '../../services/api';

const BillStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await billService.getStats();
      // Backend returns { success, message, data: stats }
      setStats(response.data.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch statistics');
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR'
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded mb-4">
        {error}
        <button 
          onClick={fetchStats}
          className="ml-4 text-danger-600 hover:text-danger-800 underline"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl text-gray-600">No statistics available</h3>
      </div>
    );
  }

  const StatCard = ({ title, value, subtitle, color = 'primary' }) => (
    <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-primary-500">
      <div className="flex items-center">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
          <p className={`text-3xl font-bold text-${color}-600`}>{value}</p>
          {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Bill Statistics</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Bills"
          value={stats.totalBills}
          subtitle="All time"
          color="primary"
        />
        
        <StatCard
          title="Paid Bills"
          value={stats.paidBills}
          subtitle={`${((stats.paidBills / stats.totalBills) * 100).toFixed(1)}% of total`}
          color="success"
        />
        
        <StatCard
          title="Pending Bills"
          value={stats.pendingBills}
          subtitle={`${((stats.pendingBills / stats.totalBills) * 100).toFixed(1)}% of total`}
          color="yellow"
        />
        
        <StatCard
          title="Total KWh"
          value={stats.totalKWh?.toFixed(1)}
          subtitle="Cumulative usage"
          color="primary"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <StatCard
          title="Total Amount"
          value={formatCurrency(stats.totalAmount)}
          subtitle="All bills combined"
          color="primary"
        />
        
        <StatCard
          title="Amount Paid"
          value={formatCurrency(stats.amountPaid)}
          subtitle="Successfully collected"
          color="success"
        />
        
        <StatCard
          title="Outstanding Balance"
          value={formatCurrency(stats.outstandingBalance)}
          subtitle="Pending payments"
          color={stats.outstandingBalance > 0 ? 'danger' : 'success'}
        />
      </div>

      {stats.totalBills > 0 && (
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Summary</h2>
          <div className="space-y-3 text-gray-700">
            <p>
              <span className="font-medium">Average bill amount:</span>{' '}
              {formatCurrency(stats.totalAmount / stats.totalBills)}
            </p>
            <p>
              <span className="font-medium">Average KWh per bill:</span>{' '}
              {(stats.totalKWh / stats.totalBills).toFixed(1)} KWh
            </p>
            <p>
              <span className="font-medium">Payment completion rate:</span>{' '}
              {((stats.paidBills / stats.totalBills) * 100).toFixed(1)}%
            </p>
            {stats.outstandingBalance > 0 && (
              <p className="text-danger-600">
                <span className="font-medium">Action needed:</span>{' '}
                {stats.pendingBills} bill(s) with {formatCurrency(stats.outstandingBalance)} outstanding balance
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BillStats;
