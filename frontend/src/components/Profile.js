import React, { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { getEnergyRecords } from '../services/energyApi';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: ''
  });
  const [stats, setStats] = useState({
    totalRecords: 0,
    monthlyConsumption: 0,
    yearlyConsumption: 0,
    averageDaily: 0,
    totalSavings: 0,
    recentRecords: []
  });

  useEffect(() => {
    const loadProfileData = async () => {
      try {
        // Get user data
        const userData = authService.getStoredUser();
        setUser(userData);
        
        // Initialize edit form with user data
        if (userData) {
          setEditForm({
            firstName: userData.firstName || '',
            lastName: userData.lastName || '',
            email: userData.email || ''
          });
        }

        // Get energy consumption data
        const response = await getEnergyRecords();
        const records = response.data || [];
        
        calculateStats(records);
      } catch (error) {
        console.error('Error loading profile data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfileData();
  }, []);

  const calculateStats = (records) => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    // Total records
    const totalRecords = records.length;

    // Monthly consumption (current month)
    const monthlyConsumption = records
      .filter(record => {
        const recordDate = new Date(record.consumption_date);
        return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear;
      })
      .reduce((total, record) => total + (parseFloat(record.energy_used_kwh) || 0), 0);

    // Yearly consumption (current year)
    const yearlyConsumption = records
      .filter(record => {
        const recordDate = new Date(record.consumption_date);
        return recordDate.getFullYear() === currentYear;
      })
      .reduce((total, record) => total + (parseFloat(record.energy_used_kwh) || 0), 0);

    // Average daily consumption (based on records from current month)
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const averageDaily = monthlyConsumption / daysInMonth;

    // Estimated savings (assuming $0.12 per kWh saved vs average household)
    const averageHouseholdUsage = 900; // kWh per month
    const savings = monthlyConsumption < averageHouseholdUsage 
      ? (averageHouseholdUsage - monthlyConsumption) * 0.12 
      : 0;

    // Recent records (last 5)
    const recentRecords = records
      .sort((a, b) => new Date(b.consumption_date) - new Date(a.consumption_date))
      .slice(0, 5);

    setStats({
      totalRecords,
      monthlyConsumption: Math.round(monthlyConsumption * 100) / 100,
      yearlyConsumption: Math.round(yearlyConsumption * 100) / 100,
      averageDaily: Math.round(averageDaily * 100) / 100,
      totalSavings: Math.round(savings * 100) / 100,
      recentRecords
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleEditClick = () => {
    setIsEditing(true);
    setMessage({ type: '', text: '' });
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setEditForm({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || ''
    });
    setMessage({ type: '', text: '' });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await authService.updateProfile(editForm);
      const updatedUser = response.data.data; // Backend returns { data: user }
      
      // Update local storage and state
      const token = localStorage.getItem('token');
      authService.storeUser(updatedUser, token);
      setUser(updatedUser);
      
      setIsEditing(false);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to update profile. Please try again.' 
      });
    } finally {
      setEditLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="loading-spinner w-12 h-12"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="card text-center">
          <h1 className="text-2xl font-bold text-textPrimary mb-4">Profile Not Found</h1>
          <p className="text-textSecondary">Please log in to view your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8 space-y-6 fade-in">
      {/* Success/Error Messages */}
      {message.text && (
        <div className={`${message.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'} border px-4 py-3 rounded-xl mb-4 fade-in`}>
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              {message.type === 'success' ? (
                <path d="M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              ) : (
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              )}
            </svg>
            <span>{message.text}</span>
          </div>
        </div>
      )}
      {/* Profile Header */}
      <div className="card">
        <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
          {/* Avatar */}
          <div className="w-24 h-24 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-3xl">
              {user.firstName?.[0]}{user.lastName?.[0]}
            </span>
          </div>
          
          {/* User Info */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-textPrimary mb-2">
              {user.firstName} {user.lastName}
            </h1>
            <p className="text-textSecondary text-lg mb-3">{user.email}</p>
            
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-green-600">Active Account</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-textSecondary" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span className="text-sm text-textSecondary">Member since {formatDate(user.createdAt || new Date())}</span>
              </div>
            </div>
          </div>
          
          {/* Edit Profile Button */}
          <button onClick={handleEditClick} className="btn-secondary">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
            </svg>
            Edit Profile
          </button>
        </div>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 11H7v8h2v-8zm4-4h-2v12h2V7zm4-3h-2v15h2V4z"/>
            </svg>
          </div>
          <div className="text-3xl font-bold text-textPrimary mb-1">{stats.totalRecords}</div>
          <div className="text-sm text-textSecondary">Total Records</div>
        </div>

        <div className="card text-center">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
          </div>
          <div className="text-3xl font-bold text-textPrimary mb-1">{stats.monthlyConsumption}</div>
          <div className="text-sm text-textSecondary">kWh This Month</div>
        </div>

        <div className="card text-center">
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          <div className="text-3xl font-bold text-textPrimary mb-1">{stats.yearlyConsumption}</div>
          <div className="text-sm text-textSecondary">kWh This Year</div>
        </div>

        <div className="card text-center">
          <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-orange-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l2 5h5l-4 3 2 5-5-3-5 3 2-5-4-3h5l2-5z"/>
            </svg>
          </div>
          <div className="text-3xl font-bold text-textPrimary mb-1">{stats.averageDaily}</div>
          <div className="text-sm text-textSecondary">Avg Daily kWh</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-textPrimary">Recent Energy Records</h2>
            <span className="text-sm text-textSecondary">{stats.recentRecords.length} recent entries</span>
          </div>
          
          {stats.recentRecords.length > 0 ? (
            <div className="space-y-4">
              {stats.recentRecords.map((record) => (
                <div key={record._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-textPrimary">{formatDate(record.consumption_date)}</p>
                      <p className="text-sm text-textSecondary">
                        {record.period_type} • {record.consumption_time || 'All day'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-textPrimary">{record.energy_used_kwh} kWh</p>
                    <span className="badge badge-secondary">{record.period_type}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
              </div>
              <p className="text-textSecondary">No energy records found</p>
            </div>
          )}
        </div>

        {/* Energy Insights */}
        <div className="card">
          <h2 className="text-xl font-bold text-textPrimary mb-6">Energy Insights</h2>
          
          <div className="space-y-6">
            {/* Monthly Progress */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-textPrimary">Monthly Usage</span>
                <span className="text-sm text-textSecondary">{stats.monthlyConsumption}/900 kWh</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full"
                  style={{ width: `${Math.min((stats.monthlyConsumption / 900) * 100, 100)}%` }}
                ></div>
              </div>
              <p className="text-xs text-textSecondary mt-1">vs. average household</p>
            </div>

            {/* Savings */}
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l2 5h5l-4 3 2 5-5-3-5 3 2-5-4-3h5l2-5z"/>
                </svg>
                <span className="text-sm font-semibold text-green-700">Estimated Savings</span>
              </div>
              <p className="text-2xl font-bold text-green-600">${stats.totalSavings}</p>
              <p className="text-xs text-green-600">this month vs average</p>
            </div>

            {/* Tips */}
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="text-sm font-semibold text-blue-700 mb-2">Energy Tip</h3>
              <p className="text-xs text-blue-600">
                {stats.monthlyConsumption > 0 
                  ? "Track your daily usage patterns to identify peak consumption times."
                  : "Start recording your energy consumption to get personalized insights!"
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-textPrimary">Edit Profile</h2>
              <button
                onClick={handleEditCancel}
                className="btn-ghost p-2 rounded-full"
              >
                <svg className="w-5 h-5 text-textSecondary" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </div>

            {/* Edit Form */}
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-textPrimary mb-2">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={editForm.firstName}
                  onChange={handleEditChange}
                  required
                  className="input-field"
                  placeholder="Enter your first name"
                />
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-textPrimary mb-2">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={editForm.lastName}
                  onChange={handleEditChange}
                  required
                  className="input-field"
                  placeholder="Enter your last name"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-textPrimary mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={editForm.email}
                  onChange={handleEditChange}
                  required
                  className="input-field"
                  placeholder="Enter your email address"
                />
              </div>

              {/* Form Actions */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleEditCancel}
                  disabled={editLoading}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="btn-primary flex-1 flex items-center justify-center"
                >
                  {editLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Updating...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;