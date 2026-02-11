import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { billService } from '../../services/api';

const CreateBill = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    billNumber: '',
    billIssueDate: '',
    totalKWh: '',
    totalPayment: '',
    totalPaid: '',
    isPaid: false
  });

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

      await billService.createBill(submitData);
      navigate('/bills');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create bill');
      console.error('Error creating bill:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card">
        <h1 className="text-3xl font-bold text-textPrimary mb-6">Create New Bill</h1>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="billNumber" className="block text-sm font-medium text-textPrimary mb-2">
              Bill Number *
            </label>
            <input
              type="text"
              id="billNumber"
              name="billNumber"
              value={formData.billNumber}
              onChange={handleChange}
              required
              className="input-field"
              placeholder="Enter unique bill number"
            />
          </div>

          <div>
            <label htmlFor="billIssueDate" className="block text-sm font-medium text-textPrimary mb-2">
              Bill Issue Date *
            </label>
            <input
              type="date"
              id="billIssueDate"
              name="billIssueDate"
              value={formData.billIssueDate}
              onChange={handleChange}
              required
              className="input-field"
            />
          </div>

          <div>
            <label htmlFor="totalKWh" className="block text-sm font-medium text-textPrimary mb-2">
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
              className="input-field"
              placeholder="Enter total kilowatt hours"
            />
          </div>

          <div>
            <label htmlFor="totalPayment" className="block text-sm font-medium text-textPrimary mb-2">
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
              className="input-field"
              placeholder="Enter total payment amount"
            />
          </div>

          <div>
            <label htmlFor="totalPaid" className="block text-sm font-medium text-textPrimary mb-2">
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
              className="input-field"
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
              className="h-4 w-4 text-primary focus:ring-secondary border-gray-300 rounded"
            />
            <label htmlFor="isPaid" className="ml-2 block text-sm text-textPrimary">
              Mark as paid
            </label>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/bills')}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Bill'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateBill;
