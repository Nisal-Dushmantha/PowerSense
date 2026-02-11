import React, { useState } from 'react';
import { billService } from '../../services/api';
import Modal from '../common/Modal';

const CreateBillModal = ({ isOpen, onClose, onBillCreated }) => {
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

  const resetForm = () => {
    setFormData({
      billNumber: '',
      billIssueDate: '',
      totalKWh: '',
      totalPayment: '',
      totalPaid: '',
      isPaid: false
    });
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

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

      const response = await billService.createBill(submitData);
      
      // Notify parent component about the new bill
      if (onBillCreated) {
        onBillCreated(response.data.data);
      }
      
      // Close modal and reset form
      handleClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create bill');
      console.error('Error creating bill:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create New Bill"
      size="default"
    >
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl mb-6 fade-in">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            <span>{error}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Bill Number */}
          <div className="md:col-span-2">
            <label htmlFor="billNumber" className="form-label">
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

          {/* Bill Issue Date */}
          <div>
            <label htmlFor="billIssueDate" className="form-label">
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

          {/* Total KWh */}
          <div>
            <label htmlFor="totalKWh" className="form-label">
              Total KWh *
            </label>
            <input
              type="number"
              id="totalKWh"
              name="totalKWh"
              value={formData.totalKWh}
              onChange={handleChange}
              required
              step="0.01"
              min="0"
              className="input-field"
              placeholder="0.00"
            />
          </div>

          {/* Total Payment */}
          <div>
            <label htmlFor="totalPayment" className="form-label">
              Total Payment (LKR) *
            </label>
            <input
              type="number"
              id="totalPayment"
              name="totalPayment"
              value={formData.totalPayment}
              onChange={handleChange}
              required
              step="0.01"
              min="0"
              className="input-field"
              placeholder="0.00"
            />
          </div>

          {/* Total Paid */}
          <div>
            <label htmlFor="totalPaid" className="form-label">
              Amount Paid (LKR)
            </label>
            <input
              type="number"
              id="totalPaid"
              name="totalPaid"
              value={formData.totalPaid}
              onChange={handleChange}
              step="0.01"
              min="0"
              className="input-field"
              placeholder="0.00"
            />
            <p className="form-help">Leave empty if not paid yet</p>
          </div>
        </div>

        {/* Payment Status */}
        <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
          <input
            type="checkbox"
            id="isPaid"
            name="isPaid"
            checked={formData.isPaid}
            onChange={handleChange}
            className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary/30"
          />
          <label htmlFor="isPaid" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Mark as paid
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="btn-ghost"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary min-w-[120px]"
          >
            {loading ? (
              <div className="flex items-center">
                <div className="loading-spinner w-4 h-4 mr-2"></div>
                Creating...
              </div>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                </svg>
                Create Bill
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateBillModal;
