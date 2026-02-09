import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { billService } from '../../services/api';

const EditBill = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    billNumber: '',
    billIssueDate: '',
    totalKWh: '',
    totalPayment: '',
    totalPaid: '',
    isPaid: false
  });

  const fetchBill = async () => {
    try {
      setFetchLoading(true);
      const response = await billService.getBillById(id);
      // Backend returns { success, message, data: bill }
      const bill = response.data.data;
      
      // Format date for input
      const formattedDate = new Date(bill.billIssueDate).toISOString().split('T')[0];
      
      setFormData({
        billNumber: bill.billNumber,
        billIssueDate: formattedDate,
        totalKWh: bill.totalKWh.toString(),
        totalPayment: bill.totalPayment.toString(),
        totalPaid: bill.totalPaid.toString(),
        isPaid: bill.isPaid
      });
      setError(null);
    } catch (err) {
      setError('Failed to fetch bill details');
      console.error('Error fetching bill:', err);
    } finally {
      setFetchLoading(false);
    }
  };

  useEffect(() => {
    fetchBill();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Convert numeric fields
      const submitData = {
        ...formData,
        totalKWh: parseFloat(formData.totalKWh),
        totalPayment: parseFloat(formData.totalPayment),
        totalPaid: parseFloat(formData.totalPaid || 0)
      };

      await billService.updateBill(id, submitData);
      navigate('/bills');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update bill');
      console.error('Error updating bill:', err);
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white shadow-lg rounded-lg p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Edit Bill</h1>
        
        {error && (
          <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="billNumber" className="block text-sm font-medium text-gray-700 mb-2">
              Bill Number *
            </label>
            <input
              type="text"
              id="billNumber"
              name="billNumber"
              value={formData.billNumber}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              placeholder="Enter unique bill number"
            />
          </div>

          <div>
            <label htmlFor="billIssueDate" className="block text-sm font-medium text-gray-700 mb-2">
              Bill Issue Date *
            </label>
            <input
              type="date"
              id="billIssueDate"
              name="billIssueDate"
              value={formData.billIssueDate}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label htmlFor="totalKWh" className="block text-sm font-medium text-gray-700 mb-2">
              Total KWh *
            </label>
            <input
              type="number"
              id="totalKWh"
              name="totalKWh"
              value={formData.totalKWh}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              placeholder="Enter total kilowatt hours"
            />
          </div>

          <div>
            <label htmlFor="totalPayment" className="block text-sm font-medium text-gray-700 mb-2">
              Total Payment *
            </label>
            <input
              type="number"
              id="totalPayment"
              name="totalPayment"
              value={formData.totalPayment}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              placeholder="Enter total payment amount"
            />
          </div>

          <div>
            <label htmlFor="totalPaid" className="block text-sm font-medium text-gray-700 mb-2">
              Total Paid
            </label>
            <input
              type="number"
              id="totalPaid"
              name="totalPaid"
              value={formData.totalPaid}
              onChange={handleChange}
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              placeholder="Enter amount paid (optional)"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isPaid"
              name="isPaid"
              checked={formData.isPaid}
              onChange={handleChange}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="isPaid" className="ml-2 block text-sm text-gray-700">
              Mark as paid
            </label>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/bills')}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Bill'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditBill;
