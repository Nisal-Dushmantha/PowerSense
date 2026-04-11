/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/authService';
import { billService } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';
import logo from '../assets/logo.png';

const Navbar = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [profileStats, setProfileStats] = useState({
    totalRecords: 0,
    monthlyConsumption: 0,
    loading: false
  });
  const navigate = useNavigate();
  const location = useLocation();
  const { isDarkMode, toggleTheme } = useTheme();

  const fetchProfileStats = useCallback(async () => {
    if (!isAuthenticated) {
      setProfileStats({ totalRecords: 0, monthlyConsumption: 0, loading: false });
      return;
    }

    try {
      setProfileStats(prev => ({ ...prev, loading: true }));
      
      // Get all bill records
      const response = await billService.getAllBills();
      const records = response?.data?.data?.bills || [];
      
      // Calculate total records
      const totalRecords = records.length;
      
      // Calculate this month's consumption
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();
      
      const monthlyConsumption = records
        .filter(record => {
          const recordDate = new Date(record.billIssueDate);
          return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear;
        })
        .reduce((total, record) => {
          return total + (parseFloat(record.totalKWh) || 0);
        }, 0);
      
      setProfileStats({
        totalRecords,
        monthlyConsumption: Math.round(monthlyConsumption * 100) / 100,
        loading: false
      });
    } catch (error) {
      console.error('Error fetching profile stats:', error);
      setProfileStats({ totalRecords: 0, monthlyConsumption: 0, loading: false });
    }
  }, [isAuthenticated]);

  const closeProfileDropdown = () => {
    setIsProfileDropdownOpen(false);
  };

  const toggleProfileDropdown = () => {
    setIsProfileDropdownOpen((prev) => {
      const next = !prev;
      if (next) {
        fetchProfileStats();
      }
      return next;
    });
  };

  useEffect(() => {
    const checkAuth = () => {
      const authenticated = authService.isAuthenticated();
      setIsAuthenticated(authenticated);
      if (authenticated) {
        const userData = authService.getStoredUser();
        setUser(userData);
      }
    };

    checkAuth();
    // Listen for auth changes
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, [location]);

  const handleLogout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setUser(null);
    setIsMobileMenuOpen(false);
    setIsProfileDropdownOpen(false);
    navigate('/login');
  };

  const isActivePath = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="sticky top-0 z-40 border-b border-primary/15 dark:border-gray-700/70 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl transition-colors duration-300 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
      <div className="max-w-7xl mx-auto container-padding">
        <div className="flex justify-between items-center h-20 gap-4">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-3 group">
              <img 
                src={logo} 
                alt="PowerSense Logo" 
                className="w-12 h-12 rounded-xl transform group-hover:scale-105 transition-transform"
              />
              <div>
                <h1 className="text-lg font-extrabold text-gradient leading-tight">PowerSense</h1>
                <p className="text-[11px] text-textSecondary dark:text-gray-400 -mt-0.5">Energy Analytics</p>
              </div>
            </Link>
          </div>

          {isAuthenticated && (
            <div className="hidden lg:flex flex-1 max-w-xl">
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="Search bills, consumption, devices..."
                  className="w-full rounded-2xl border border-primary/15 bg-primary/5 py-2.5 pl-10 pr-4 text-sm text-textPrimary placeholder:text-textSecondary focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary"
                />
                <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-textSecondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m21 21-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z" />
                </svg>
              </div>
            </div>
          )}

          {/* Desktop Navigation */}
          {isAuthenticated && (
            <div className="hidden md:flex items-center space-x-1 rounded-2xl border border-primary/15 bg-white/80 dark:bg-gray-800/80 dark:border-gray-700 p-1">
              <Link
                to="/"
                className={`${
                  isActivePath('/') ? 'nav-link-active' : 'nav-link'
                }`}
              >
                Home
              </Link>
              
              <Link
                to="/bills"
                className={`${
                  isActivePath('/bills') || isActivePath('/bills/new') || location.pathname.includes('/bills/edit')
                    ? 'nav-link-active'
                    : 'nav-link'
                }`}
              >
                Bills
              </Link>
              
              <Link
                to="/consumption"
                className={`${
                  isActivePath('/consumption') ? 'nav-link-active' : 'nav-link'
                }`}
              >
                Consumption
              </Link>
              
              <Link
                to="/renewable"
                className={`${
                  location.pathname.startsWith('/renewable') ? 'nav-link-active' : 'nav-link'
                }`}
              >
                Renewable
              </Link>
              
              <Link
                to="/devices"
                className={`${
                  isActivePath('/devices') ? 'nav-link-active' : 'nav-link'
                }`}
              >
                Devices
              </Link>
              
            </div>
          )}

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl bg-primary/5 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-200 border border-primary/15 dark:border-gray-700"
              aria-label="Toggle dark mode"
              title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDarkMode ? (
                /* Sun icon for light mode */
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z"/>
                </svg>
              ) : (
                /* Moon icon for dark mode */
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z"/>
                </svg>
              )}
            </button>

            {isAuthenticated ? (
              <>                
                {/* User Profile Dropdown - Desktop */}
                <div className="hidden md:flex items-center space-x-3 relative profile-dropdown">
                  <button
                    onClick={toggleProfileDropdown}
                    className="flex items-center space-x-3 p-2 rounded-2xl hover:bg-primary/5 transition-colors cursor-pointer border border-primary/15 bg-white/80 dark:bg-gray-800/80 dark:border-gray-700"
                  >
                    <div className="text-right">
                      <p className="text-sm font-semibold text-textPrimary">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="text-xs text-textSecondary">{user?.email}</p>
                    </div>
                    <div className="w-10 h-10 bg-gradient-to-r from-primary to-secondary rounded-xl flex items-center justify-center shadow-sm">
                      <span className="text-white font-semibold text-sm">
                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                      </span>
                    </div>
                    <svg 
                      className={`w-4 h-4 text-textSecondary transition-transform ${isProfileDropdownOpen ? 'rotate-180' : ''}`} 
                      fill="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path d="M7 10l5 5 5-5z"/>
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {isProfileDropdownOpen && (
                    <div className="absolute top-full right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-primary/15 dark:border-gray-700 py-2 z-50 fade-in">
                      {/* User Info Header */}
                      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold">
                              {user?.firstName?.[0]}{user?.lastName?.[0]}
                            </span>
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-textPrimary">
                              {user?.firstName} {user?.lastName}
                            </h3>
                            <p className="text-sm text-textSecondary">{user?.email}</p>
                            <div className="flex items-center space-x-1 mt-1">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span className="text-xs text-green-600 font-medium">Active</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Profile Stats */}
                      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                        <div className="grid grid-cols-2 gap-4 text-center">
                          <div>
                            <div className="text-lg font-bold text-textPrimary">
                              {profileStats.loading ? (
                                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                              ) : (
                                profileStats.totalRecords
                              )}
                            </div>
                            <div className="text-xs text-textSecondary">Records</div>
                          </div>
                          <div>
                            <div className="text-lg font-bold text-textPrimary">
                              {profileStats.loading ? (
                                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                              ) : (
                                `${profileStats.monthlyConsumption} kWh`
                              )}
                            </div>
                            <div className="text-xs text-textSecondary">This Month</div>
                          </div>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="py-2">
                        <hr className="my-2 border-gray-100 dark:border-gray-700" />
                        
                        <button
                          onClick={() => {
                            closeProfileDropdown();
                            handleLogout();
                          }}
                          className="w-full px-4 py-2 text-left hover:bg-red-50 flex items-center space-x-3 transition-colors text-red-600"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M16 17l5-5-5-5M19.8 12H9M10 3H6a2 2 0 00-2 2v14a2 2 0 002 2h4"/>
                          </svg>
                          <span className="text-sm font-medium">Logout</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                {/* Logout Button - Desktop */}
                <button
                  onClick={handleLogout}
                  className="hidden md:flex btn-ghost btn-sm"
                >
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M16 17l5-5-5-5M19.8 12H9M10 3H6a2 2 0 00-2 2v14a2 2 0 002 2h4"/>
                  </svg>
                  Logout
                </button>

                {/* Mobile Menu Button */}
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400"
                  aria-label="Toggle menu"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    {isMobileMenuOpen ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                    )}
                  </svg>
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className={`${isActivePath('/login') ? 'btn-primary' : 'btn-ghost'} btn-sm`}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className={`${isActivePath('/register') ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {isAuthenticated && isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200/50 dark:border-gray-700/50 py-4 fade-in">
            <div className="space-y-3">
              {/* User Profile Card - Mobile */}
              <div className="p-4 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl border border-primary/20">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-14 h-14 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-textPrimary text-lg">
                      {user?.firstName} {user?.lastName}
                    </h3>
                    <p className="text-sm text-textSecondary">{user?.email}</p>
                    <div className="flex items-center space-x-1 mt-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs text-green-600 font-medium">Active Account</span>
                    </div>
                  </div>
                </div>
                
                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-white/50 dark:bg-gray-700/60 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-textPrimary">
                      {profileStats.loading ? (
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                      ) : (
                        profileStats.totalRecords
                      )}
                    </div>
                    <div className="text-xs text-textSecondary">Records</div>
                  </div>
                  <div className="bg-white/50 dark:bg-gray-700/60 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-textPrimary">
                      {profileStats.loading ? (
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                      ) : (
                        `${profileStats.monthlyConsumption} kWh`
                      )}
                    </div>
                    <div className="text-xs text-textSecondary">This Month</div>
                  </div>
                </div>
                
                {/* Profile Actions */}
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      navigate('/profile');
                    }}
                    className="btn-secondary btn-sm text-xs"
                  >
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                    View Profile
                  </button>
                  <button 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="btn-secondary btn-sm text-xs"
                  >
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
                    </svg>
                    Settings
                  </button>
                </div>
              </div>

              {/* User Info - Mobile */}
              <div className="flex items-center space-x-3 p-3 bg-gray-50/50 dark:bg-gray-800/50 rounded-xl">
                <div className="w-12 h-12 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-textPrimary dark:text-gray-200">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-sm text-textSecondary dark:text-gray-400">{user?.email}</p>
                </div>
              </div>

              {/* Dark Mode Toggle - Mobile */}
              <div className="px-3">
                <button
                  onClick={toggleTheme}
                  className="flex items-center space-x-3 w-full p-3 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                >
                  {isDarkMode ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z"/>
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z"/>
                    </svg>
                  )}
                  <span className="font-medium">
                    {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                  </span>
                </button>
              </div>

              {/* Navigation Links - Mobile */}
              <div className="space-y-1">
                <Link
                  to="/"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`${
                    isActivePath('/') ? 'nav-link-active' : 'nav-link'
                  } w-full`}
                >
                  Home
                </Link>
                
                <Link
                  to="/bills"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`${
                    isActivePath('/bills') || isActivePath('/bills/new') || location.pathname.includes('/bills/edit')
                      ? 'nav-link-active'
                      : 'nav-link'
                  } w-full`}
                >
                  Bills
                </Link>
                
                <Link
                  to="/consumption"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`${
                    isActivePath('/consumption') ? 'nav-link-active' : 'nav-link'
                  } w-full`}
                >
                  Consumption
                </Link>
                
                <Link
                  to="/renewable"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`${
                    location.pathname.startsWith('/renewable') ? 'nav-link-active' : 'nav-link'
                  } w-full`}
                >
                  Renewable
                </Link>
                
                <Link
                  to="/devices"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`${
                    isActivePath('/devices') ? 'nav-link-active' : 'nav-link'
                  } w-full`}
                >
                  Devices
                </Link>
              </div>

              {/* Logout Button - Mobile */}
              <button
                onClick={handleLogout}
                className="btn-danger w-full mt-4 flex items-center justify-center space-x-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M16 17l5-5-5-5M19.8 12H9M10 3H6a2 2 0 00-2 2v14a2 2 0 002 2h4"/>
                </svg>
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
