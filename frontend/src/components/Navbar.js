import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/authService';
import { useTheme } from '../contexts/ThemeContext';

const Navbar = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { isDarkMode, toggleTheme } = useTheme();

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
    navigate('/login');
  };

  const isActivePath = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-40 transition-colors duration-300">
      <div className="max-w-7xl mx-auto container-padding">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 bg-gradient-to-r from-primary to-secondary rounded-xl flex items-center justify-center transform group-hover:scale-105 transition-transform">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gradient">PowerSense</h1>
                <p className="text-xs text-textSecondary dark:text-gray-400 -mt-1">Energy Management</p>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          {isAuthenticated && (
            <div className="hidden md:flex items-center space-x-1">
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
                  isActivePath('/renewable') ? 'nav-link-active' : 'nav-link'
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
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-200"
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
                {/* User Info - Desktop */}
                <div className="hidden md:flex items-center space-x-3">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-textPrimary dark:text-gray-200">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-textSecondary dark:text-gray-400">{user?.email}</p>
                  </div>
                  <div className="w-10 h-10 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </span>
                  </div>
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
                    isActivePath('/renewable') ? 'nav-link-active' : 'nav-link'
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
