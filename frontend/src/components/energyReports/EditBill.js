import React, { useState, useEffect } from 'react';
import { billService } from '../../services/api';
import { getApiRootUrl } from '../../services/runtimeApiBase';
import Modal from '../common/Modal';

const API_ROOT_URL = getApiRootUrl();

const getBillPhotoUrl = (photoValue) => {
  if (!photoValue) return '';

  if (/^https?:\/\//i.test(photoValue)) {
    try {
      const parsed = new URL(photoValue);
      if (/(^|\.)localhost$/.test(parsed.hostname) || parsed.hostname === '127.0.0.1') {
        return `${API_ROOT_URL}${parsed.pathname}`;
      }
      return photoValue;
    } catch {
      return photoValue;
    }
  }

  const normalized = String(photoValue).replace(/^\/+/, '');
  if (normalized.startsWith('uploads/')) {
    return `${API_ROOT_URL}/${normalized}`;
  }

  return `${API_ROOT_URL}/uploads/bills/${normalized}`;
};

const EditBillModal = ({ isOpen, onClose, billData, onBillUpdated }) => {
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
  const [billPhoto, setBillPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [currentPhoto, setCurrentPhoto] = useState(null);

  const resetForm = () => {
    setFormData({
      billNumber: '',
      billIssueDate: '',
      totalKWh: '',
      totalPayment: '',
      totalPaid: '',
      isPaid: false
    });
    setBillPhoto(null);
    setPhotoPreview(null);
    setCurrentPhoto(null);
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const initializeForm = (bill) => {
    if (!bill) return;
    
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
    
    // Set current photo if exists
    if (bill.billPhoto) {
      setCurrentPhoto(bill.billPhoto);
    } else {
      setCurrentPhoto(null);
    }
    
    setError(null);
  };

  useEffect(() => {
    if (isOpen && billData) {
      initializeForm(billData);
    } else if (!isOpen) {
      resetForm();
    }
  }, [isOpen, billData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }

      setBillPhoto(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target.result);
      };
      reader.readAsDataURL(file);
      setError(null);
    }
  };

  const removePhoto = () => {
    setBillPhoto(null);
    setPhotoPreview(null);
    // Reset file input
    const fileInput = document.getElementById('billPhoto');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Frontend date validation — no future dates
    if (formData.billIssueDate) {
      const issueDate = new Date(formData.billIssueDate);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (issueDate > today) {
        setError('Bill issue date cannot be a future date');
        setLoading(false);
        return;
      }
    }

    try {
      // Create FormData for file upload
      const formDataToSend = new FormData();
      formDataToSend.append('billNumber', formData.billNumber);
      formDataToSend.append('billIssueDate', formData.billIssueDate);
      formDataToSend.append('totalKWh', parseFloat(formData.totalKWh));
      formDataToSend.append('totalPayment', parseFloat(formData.totalPayment));
      formDataToSend.append('totalPaid', parseFloat(formData.totalPaid || 0));
      formDataToSend.append('isPaid', formData.isPaid);
      
      if (billPhoto) {
        formDataToSend.append('billPhoto', billPhoto);
      }

      const response = await billService.updateBill(billData._id, formDataToSend);
      
      // Notify parent component about the updated bill
      if (onBillUpdated) {
        onBillUpdated(response.data.data);
      }
      
      // Close modal and reset form
      handleClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update bill');
      console.error('Error updating bill:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Edit Bill"
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
                  max={new Date().toISOString().split('T')[0]}
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

            {/* Bill Photo Upload */}
            <div>
              <label className="form-label">Bill Photo (Optional)</label>
              
              {/* Show current photo if exists and no new preview */}
              {currentPhoto && !photoPreview ? (
                <div className="mt-2">
                  <div className="relative">
                    <img
                      src={getBillPhotoUrl(currentPhoto)}
                      alt="Current bill"
                      className="w-full h-48 object-cover rounded-xl border border-gray-200 dark:border-gray-600"
                    />
                    <div className="mt-2 flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <svg className="w-4 h-4 mr-1 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                      </svg>
                      Current photo - Upload a new one to replace
                    </div>
                  </div>
                </div>
              ) : null}
              
              {!photoPreview && !currentPhoto ? (
                <div className="mt-2">
                  <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-xl hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
                    <div className="space-y-1 text-center">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                      >
                        <path
                          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <div className="flex text-sm text-gray-600 dark:text-gray-400">
                        <label
                          htmlFor="billPhoto"
                          className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-primary hover:text-primary-dark focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary"
                        >
                          <span>Upload a photo</span>
                          <input
                            id="billPhoto"
                            name="billPhoto"
                            type="file"
                            className="sr-only"
                            accept="image/*"
                            onChange={handlePhotoChange}
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG, GIF up to 5MB</p>
                    </div>
                  </div>
                </div>
              ) : photoPreview ? (
                <div className="mt-2">
                  <div className="relative">
                    <img
                      src={photoPreview}
                      alt="Bill preview"
                      className="w-full h-48 object-cover rounded-xl border border-gray-200 dark:border-gray-600"
                    />
                    <button
                      type="button"
                      onClick={removePhoto}
                      className="absolute top-2 right-2 p-1 bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 rounded-full hover:bg-red-200 dark:hover:bg-red-900/70 transition-colors"
                      title="Remove photo"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18.3 5.71a.996.996 0 00-1.41 0L12 10.59 7.11 5.7A.996.996 0 105.7 7.11L10.59 12 5.7 16.89a.996.996 0 101.41 1.41L12 13.41l4.89 4.89a.996.996 0 101.41-1.41L13.41 12l4.89-4.89c.38-.38.38-1.02 0-1.4z"/>
                      </svg>
                    </button>
                  </div>
                  <div className="mt-2 flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <svg className="w-4 h-4 mr-1 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    New photo selected
                  </div>
                </div>
              ) : currentPhoto ? (
                <div className="mt-2">
                  <div className="flex justify-center px-6 pt-3 pb-3 border border-gray-300 dark:border-gray-600 rounded-xl">
                    <label
                      htmlFor="billPhoto"
                      className="cursor-pointer text-primary hover:text-primary-dark font-medium"
                    >
                      <span>Change photo</span>
                      <input
                        id="billPhoto"
                        name="billPhoto"
                        type="file"
                        className="sr-only"
                        accept="image/*"
                        onChange={handlePhotoChange}
                      />
                    </label>
                  </div>
                </div>
              ) : null}
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
                    Updating...
                  </div>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/>
                    </svg>
                    Update Bill
                  </>
                )}
              </button>
            </div>
          </form>
    </Modal>
  );
};

export default EditBillModal;
