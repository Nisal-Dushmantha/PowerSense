import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/authService';

const Navbar = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

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
    <nav className="bg-white/80 backdrop-blur-lg border-b border-gray-200/50 sticky top-0 z-40">
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
                <p className="text-xs text-textSecondary -mt-1">Energy Management</p>
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
                to="/stats"
                className={`${
                  isActivePath('/stats') ? 'nav-link-active' : 'nav-link'
                }`}
              >
                Statistics
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
            {isAuthenticated ? (
              <>
                {/* User Info - Desktop */}
                <div className="hidden md:flex items-center space-x-3">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-textPrimary">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-textSecondary">{user?.email}</p>
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
                  className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
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
          <div className="md:hidden border-t border-gray-200/50 py-4 fade-in">
            <div className="space-y-3">
              {/* User Info - Mobile */}
              <div className="flex items-center space-x-3 p-3 bg-gray-50/50 rounded-xl">
                <div className="w-12 h-12 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-textPrimary">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-sm text-textSecondary">{user?.email}</p>
                </div>
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
                  to="/stats"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`${
                    isActivePath('/stats') ? 'nav-link-active' : 'nav-link'
                  } w-full`}
                >
                  Statistics
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
                
                <Link
                  to="/renewable"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`${
                    isActivePath('/renewable') || location.pathname.includes('/renewable')
                      ? 'nav-link-active'
                      : 'nav-link'
                  } flex items-center space-x-3 w-full`}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                  </svg>
                  <span>Renewable Energy</span>
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
