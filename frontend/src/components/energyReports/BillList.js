import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { billService } from '../../services/api';
import CreateBillModal from './CreateBillModal';

const BillList = () => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    try {
      setLoading(true);
      const response = await billService.getAllBills();
      // Backend returns { success, message, data: { bills, pagination } }
      setBills(response.data.data.bills);
      setError(null);
    } catch (err) {
      setError('Failed to fetch bills');
      console.error('Error fetching bills:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this bill?')) {
      try {
        await billService.deleteBill(id);
        setBills(bills.filter(bill => bill._id !== id));
      } catch (err) {
        setError('Failed to delete bill');
        console.error('Error deleting bill:', err);
      }
    }
  };

  const handleBillCreated = (newBill) => {
    setBills(prevBills => [newBill, ...prevBills]);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR'
    }).format(amount);
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
          onClick={fetchBills}
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
          <h1 className="text-3xl font-bold text-textPrimary dark:text-gray-100">Electricity Bills</h1>
          <p className="text-textSecondary dark:text-gray-300 mt-1">Manage your monthly electricity bills</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="btn-primary flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
          </svg>
          Add New Bill
        </button>
      </div>

      {bills.length === 0 ? (
        <div className="text-center py-12">
          <div className="card card-gradient max-w-md mx-auto">
            <div className="card-body text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
                  <polyline points="14,2 14,8 20,8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10,9 9,9 8,9"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-textPrimary dark:text-gray-100 mb-2">No bills found</h3>
              <p className="text-textSecondary dark:text-gray-300 mb-6">Start by creating your first electricity bill</p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="btn-primary inline-flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                </svg>
                Create Your First Bill
              </button>
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
                  <th>Bill Number</th>
                  <th>Issue Date</th>
                  <th>Usage (KWh)</th>
                  <th>Total Payment</th>
                  <th>Balance</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bills.map((bill) => (
                  <tr key={bill._id} className="table-row">
                    <td className="table-cell font-medium text-textPrimary dark:text-gray-100">
                      #{bill.billNumber}
                    </td>
                    <td className="table-cell">
                      {formatDate(bill.billIssueDate)}
                    </td>
                    <td className="table-cell">
                      <span className="font-semibold text-textPrimary dark:text-gray-200">{bill.totalKWh}</span> 
                      <span className="text-textSecondary dark:text-gray-400"> KWh</span>
                    </td>
                    <td className="table-cell font-semibold text-textPrimary dark:text-gray-200">
                      {formatCurrency(bill.totalPayment)}
                    </td>
                    <td className="table-cell">
                      <span className={`font-semibold ${
                        bill.balance > 0 
                          ? 'text-red-600 dark:text-red-400' 
                          : 'text-green-600 dark:text-green-400'
                      }`}>
                        {formatCurrency(bill.balance)}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className={`badge ${
                        bill.isPaid ? 'badge-success' : 'badge-warning'
                      }`}>
                        {bill.isPaid ? (
                          <>
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                            </svg>
                            Paid
                          </>
                        ) : (
                          <>
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                            </svg>
                            Pending
                          </>
                        )}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center space-x-2">
                        <Link
                          to={`/bills/edit/${bill._id}`}
                          className="btn-ghost btn-sm text-secondary hover:text-primary dark:text-secondary dark:hover:text-primary-light"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                          </svg>
                        </Link>
                        <button
                          onClick={() => handleDelete(bill._id)}
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
            {bills.map((bill) => (
              <div key={bill._id} className="card-hover p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-textPrimary dark:text-gray-100">#{bill.billNumber}</h3>
                    <p className="text-sm text-textSecondary dark:text-gray-400">{formatDate(bill.billIssueDate)}</p>
                  </div>
                  <span className={`badge ${
                    bill.isPaid ? 'badge-success' : 'badge-warning'
                  }`}>
                    {bill.isPaid ? 'Paid' : 'Pending'}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div>
                    <span className="text-textSecondary dark:text-gray-400">Usage</span>
                    <p className="font-semibold text-textPrimary dark:text-gray-200">{bill.totalKWh} KWh</p>
                  </div>
                  <div>
                    <span className="text-textSecondary dark:text-gray-400">Total</span>
                    <p className="font-semibold text-textPrimary dark:text-gray-200">{formatCurrency(bill.totalPayment)}</p>
                  </div>
                  <div>
                    <span className="text-textSecondary dark:text-gray-400">Balance</span>
                    <p className={`font-semibold ${
                      bill.balance > 0 
                        ? 'text-red-600 dark:text-red-400' 
                        : 'text-green-600 dark:text-green-400'
                    }`}>
                      {formatCurrency(bill.balance)}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Link
                    to={`/bills/edit/${bill._id}`}
                    className="btn-secondary btn-sm"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(bill._id)}
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

      {/* Create Bill Modal */}
      <CreateBillModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onBillCreated={handleBillCreated}
      />
    </div>
  );
};

export default BillList;
