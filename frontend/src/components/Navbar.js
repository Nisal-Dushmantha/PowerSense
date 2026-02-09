import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="bg-primary-600 shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <Link to="/" className="text-white text-2xl font-bold">
            ⚡ PowerSense
          </Link>
          
          <div className="flex space-x-6">
            <div className="flex items-center space-x-1">
              <span className="text-white mr-2">Bills</span>
              <Link
                to="/bills"
                className={`text-white hover:text-primary-200 transition-colors px-2 py-1 rounded ${
                  isActive('/bills') && !isActive('/bills/new') ? 'bg-primary-700' : ''
                }`}
              >
                View All
              </Link>
              <Link
                to="/bills/new"
                className={`text-white hover:text-primary-200 transition-colors px-2 py-1 rounded ${
                  isActive('/bills/new') ? 'bg-primary-700' : ''
                }`}
              >
                Add New
              </Link>
            </div>

            <div className="flex items-center space-x-1">
              <span className="text-white mr-2">Energy</span>
              <Link
                to="/energy-consumption"
                className={`text-white hover:text-primary-200 transition-colors px-2 py-1 rounded ${
                  isActive('/energy-consumption') && !isActive('/energy-consumption/new') ? 'bg-primary-700' : ''
                }`}
              >
                View Records
              </Link>
              <Link
                to="/energy-consumption/new"
                className={`text-white hover:text-primary-200 transition-colors px-2 py-1 rounded ${
                  isActive('/energy-consumption/new') ? 'bg-primary-700' : ''
                }`}
              >
                Add Record
              </Link>
              <Link
                to="/energy-consumption/stats"
                className={`text-white hover:text-primary-200 transition-colors px-2 py-1 rounded ${
                  isActive('/energy-consumption/stats') ? 'bg-primary-700' : ''
                }`}
              >
                Statistics
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
