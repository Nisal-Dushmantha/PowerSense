import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import { authService } from './services/authService';
import { ThemeProvider } from './contexts/ThemeContext';

// Components
import PrivateRoute from './components/PrivateRoute';
import Home from './components/Home';
import Profile from './components/Profile';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import BillList from './components/energyReports/BillList';
import CreateBill from './components/energyReports/CreateBill';
import EditBill from './components/energyReports/EditBill';
import BillStats from './components/energyReports/BillStats';
import DevicesList from './components/Devices/DevicesList';
import CreateDevice from './components/Devices/CreateDevice';
import EditDevice from './components/Devices/EditDevice';
import EnergyConsumption from './components/energyConsumption';

// Initialize auth service
authService.init();

function App() {
  return (
    <ThemeProvider>
      <Router>
        <div className="min-h-screen bg-background dark:bg-gray-900 transition-colors duration-300">
          <Navbar />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected Routes */}
            <Route path="/bills" element={
              <PrivateRoute>
                <div className="container mx-auto px-4 py-8">
                  <BillList />
                </div>
              </PrivateRoute>
            } />
            <Route path="/bills/new" element={
              <PrivateRoute>
                <div className="container mx-auto px-4 py-8">
                  <CreateBill />
                </div>
              </PrivateRoute>
            } />
            <Route path="/bills/edit/:id" element={
              <PrivateRoute>
                <div className="container mx-auto px-4 py-8">
                  <EditBill />
                </div>
              </PrivateRoute>
            } />
            <Route path="/stats" element={
              <PrivateRoute>
                <div className="container mx-auto px-4 py-8">
                  <BillStats />
                </div>
              </PrivateRoute>
            } />
            
            <Route path="/profile" element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            } />
            
            {/* Placeholder routes for new nav items */}
            <Route path="/consumption/*" element={
              <PrivateRoute>
                <EnergyConsumption />
              </PrivateRoute>
            } />
            <Route path="/renewable" element={
              <PrivateRoute>
                <div className="container mx-auto px-4 py-8">
                  <div className="text-center">
                    <h1 className="text-2xl font-bold text-textPrimary dark:text-gray-200 mb-4">Renewable Energy</h1>
                    <p className="text-textSecondary dark:text-gray-400">Coming soon...</p>
                  </div>
                </div>
              </PrivateRoute>
            } />
            <Route path="/devices" element={
              <PrivateRoute>
                  <div className="container mx-auto px-4 py-8">
                    <DevicesList />
                  </div>
              </PrivateRoute>
            } />
              <Route path="/devices/edit/:id" element={
                <PrivateRoute>
                  <div className="container mx-auto px-4 py-8">
                    <EditDevice />
                  </div>
                </PrivateRoute>
              } />
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
