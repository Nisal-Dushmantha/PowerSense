import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
  const location = useLocation();

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
          
          <div className="flex space-x-6">
            <Link
              to="/bills"
              className={`text-white hover:text-primary-200 transition-colors ${
                isActive('/bills') ? 'text-primary-200 border-b-2 border-primary-200' : ''
              }`}
            >
              Bills
            </Link>
            <Link
              to="/devices"
              className={`text-white hover:text-primary-200 transition-colors ${
                isActive('/devices') ? 'text-primary-200 border-b-2 border-primary-200' : ''
              }`}
            >
              Devices
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
              to="/devices/new"
              className={`text-white hover:text-primary-200 transition-colors ${
                isActive('/devices/new') ? 'text-primary-200 border-b-2 border-primary-200' : ''
              }`}
            >
              Add Device
            </Link>
            <Link
              to="/stats"
              className={`text-white hover:text-primary-200 transition-colors ${
                isActive('/stats') ? 'text-primary-200 border-b-2 border-primary-200' : ''
              }`}
            >
              Statistics
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
