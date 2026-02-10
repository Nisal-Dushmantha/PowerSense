import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const loggedIn = authService.isAuthenticated();
    setIsAuthenticated(loggedIn);
    
    if (loggedIn) {
      const storedUser = authService.getStoredUser();
      setUser(storedUser);
    }
  }, [location]);

  const handleLogout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setUser(null);
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="bg-primary-600 shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <Link to="/" className="text-white text-2xl font-bold">
            ⚡ PowerSense
          </Link>
          
          {isAuthenticated ? (
            <div className="flex items-center space-x-6">
              <Link
                to="/bills"
                className={`text-white hover:text-primary-200 transition-colors ${
                  isActive('/bills') ? 'text-primary-200 border-b-2 border-primary-200' : ''
                }`}
              >
                Bills
              </Link>
              <Link
                to="/bills/new"
                className={`text-white hover:text-primary-200 transition-colors ${
                  isActive('/bills/new') ? 'text-primary-200 border-b-2 border-primary-200' : ''
                }`}
              >
                Add New Bill
              </Link>
              <Link
                to="/stats"
                className={`text-white hover:text-primary-200 transition-colors ${
                  isActive('/stats') ? 'text-primary-200 border-b-2 border-primary-200' : ''
                }`}
              >
                Statistics
              </Link>
              
              <div className="flex items-center space-x-4 border-l border-primary-500 pl-6">
                <span className="text-white text-sm">
                  👤 {user?.firstName} {user?.lastName}
                </span>
                <button
                  onClick={handleLogout}
                  className="bg-danger-500 hover:bg-danger-600 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                >
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <div className="flex space-x-4">
              <Link
                to="/login"
                className="text-white hover:text-primary-200 transition-colors px-4 py-2"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="bg-white text-primary-600 hover:bg-primary-50 px-4 py-2 rounded-lg transition-colors font-medium"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
