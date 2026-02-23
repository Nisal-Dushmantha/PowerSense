import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { renewableService } from '../../services/api';

const RenewableDashboard = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingRecord, setDeletingRecord] = useState(null);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const response = await renewableService.getRecords();
      setRecords(response.data.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch energy records');
      console.error('Error fetching records:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (record) => {
    setDeletingRecord(record);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deletingRecord) return;
    
    try {
      await renewableService.deleteRecord(deletingRecord._id);
      setRecords(records.filter(record => record._id !== deletingRecord._id));
      setShowDeleteModal(false);
      setDeletingRecord(null);
    } catch (err) {
      setError('Failed to delete record');
      console.error('Error deleting record:', err);
      setShowDeleteModal(false);
      setDeletingRecord(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDeletingRecord(null);
  };

  const formatNumber = (num) => {
    if (!num) return '0';
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(num);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loading-spinner w-12 h-12"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4">
        <div className="flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          <span>{error}</span>
        </div>
        <button 
          onClick={fetchRecords}
          className="ml-4 text-red-600 hover:text-red-800 underline font-medium"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-textPrimary dark:text-gray-100">Renewable Energy Records</h1>
          <p className="text-textSecondary dark:text-gray-300 mt-1">Track your renewable energy production</p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/renewable/sources"
            className="btn-secondary flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M13 3h-2v10h2V3zm4.83 2.17l-1.42 1.42C17.99 7.86 19 9.81 19 12c0 3.87-3.13 7-7 7s-7-3.13-7-7c0-2.19 1.01-4.14 2.58-5.42L6.17 5.17C4.23 6.82 3 9.26 3 12c0 4.97 4.03 9 9 9s9-4.03 9-9c0-2.74-1.23-5.18-3.17-6.83z"/>
            </svg>
            Manage Sources
          </Link>
          <Link
            to="/renewable/records/new"
            className="btn-primary flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
            Add New Record
          </Link>
        </div>
      </div>

      {records.length === 0 ? (
        <div className="text-center py-12">
          <div className="card card-gradient max-w-md mx-auto">
            <div className="card-body text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M13 3h-2v10h2V3zm4.83 2.17l-1.42 1.42C17.99 7.86 19 9.81 19 12c0 3.87-3.13 7-7 7s-7-3.13-7-7c0-2.19 1.01-4.14 2.58-5.42L6.17 5.17C4.23 6.82 3 9.26 3 12c0 4.97 4.03 9 9 9s9-4.03 9-9c0-2.74-1.23-5.18-3.17-6.83z"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-textPrimary dark:text-gray-100 mb-2">No energy records found</h3>
              <p className="text-textSecondary dark:text-gray-300 mb-6">Start by creating your first energy record</p>
              <Link
                to="/renewable/records/new"
                className="btn-primary inline-flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                </svg>
                Create Your First Record
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="card overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th>Source</th>
                  <th>Date</th>
                  <th>Energy Generated</th>
                  <th>Efficiency</th>
                  <th>Cost Savings</th>
                  <th>Weather</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record._id} className="table-row">
                    <td className="table-cell font-medium text-textPrimary dark:text-gray-100">
                      {record.source?.sourceName || 'N/A'}
                      <span className="block text-xs text-textSecondary dark:text-gray-400">
                        {record.source?.sourceType}
                      </span>
                    </td>
                    <td className="table-cell">
                      {formatDate(record.recordDate)}
                    </td>
                    <td className="table-cell">
                      <span className="font-semibold text-textPrimary dark:text-gray-200">{formatNumber(record.energyGenerated)}</span> 
                      <span className="text-textSecondary dark:text-gray-400"> {record.energyUnit || 'kWh'}</span>
                    </td>
                    <td className="table-cell font-semibold text-textPrimary dark:text-gray-200">
                      {record.efficiency ? `${formatNumber(record.efficiency)}%` : 'N/A'}
                    </td>
                    <td className="table-cell">
                      <span className="font-semibold text-green-600 dark:text-green-400">
                        {record.costSavings ? `Rs. ${formatNumber(record.costSavings)}` : 'N/A'}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className="badge badge-secondary">
                        {record.weatherCondition || 'N/A'}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center space-x-2">
                        <Link
                          to={`/renewable/records/edit/${record._id}`}
                          className="btn-ghost btn-sm text-secondary hover:text-primary dark:text-secondary dark:hover:text-primary-light"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                          </svg>
                        </Link>
                        <button
                          onClick={() => handleDelete(record)}
                          className="btn-ghost btn-sm text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-4 p-4">
            {records.map((record) => (
              <div key={record._id} className="card-hover p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-textPrimary dark:text-gray-100">
                      {record.source?.sourceName || 'N/A'}
                    </h3>
                    <p className="text-sm text-textSecondary dark:text-gray-400">{formatDate(record.recordDate)}</p>
                  </div>
                  <span className="badge badge-secondary">
                    {record.weatherCondition || 'N/A'}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div>
                    <span className="text-textSecondary dark:text-gray-400">Energy</span>
                    <p className="font-semibold text-textPrimary dark:text-gray-200">
                      {formatNumber(record.energyGenerated)} {record.energyUnit || 'kWh'}
                    </p>
                  </div>
                  <div>
                    <span className="text-textSecondary dark:text-gray-400">Efficiency</span>
                    <p className="font-semibold text-textPrimary dark:text-gray-200">
                      {record.efficiency ? `${formatNumber(record.efficiency)}%` : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="text-textSecondary dark:text-gray-400">Cost Savings</span>
                    <p className="font-semibold text-green-600 dark:text-green-400">
                      {record.costSavings ? `Rs. ${formatNumber(record.costSavings)}` : 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Link
                    to={`/renewable/records/edit/${record._id}`}
                    className="btn-secondary btn-sm"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(record)}
                    className="btn-danger btn-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Creative Delete Confirmation Modal */}
      {showDeleteModal && deletingRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full transform transition-all animate-scale-in">
            {/* Warning Icon with Animation */}
            <div className="flex justify-center pt-8 pb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-red-500 rounded-full opacity-20 animate-ping"></div>
                <div className="relative bg-gradient-to-br from-red-500 to-red-600 rounded-full p-4">
                  <svg className="w-12 h-12 text-white animate-shake" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="px-8 pb-6 text-center">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                ⚡ Delete This Energy Record?
              </h3>
              <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl p-4 mb-4">
                <p className="text-lg font-semibold text-red-700 dark:text-red-300 mb-2">
                  {deletingRecord.source?.sourceName || 'Energy Record'}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Date: <span className="font-medium">{formatDate(deletingRecord.date)}</span>
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Energy: <span className="font-medium">{formatNumber(deletingRecord.energyGenerated)} kWh</span>
                </p>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-2">
                This action cannot be undone! 🚨
              </p>
              <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                This record will be permanently deleted from your history.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 px-8 pb-8">
              <button
                onClick={cancelDelete}
                className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 px-6 py-3 rounded-xl transition-all duration-200 font-semibold transform hover:scale-105 active:scale-95"
              >
                🛡️ Keep It
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-3 rounded-xl transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
              >
                🗑️ Delete Forever
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RenewableDashboard;
