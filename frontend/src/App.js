import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';
import Home from './components/Home';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import BillList from './components/energyReports/BillList';
import CreateBill from './components/energyReports/CreateBill';
import EditBill from './components/energyReports/EditBill';
import RenewableDashboard from './components/Renewable/RenewableDashboard';
import RenewableSource from './components/Renewable/RenewableSource';
import RenewableEnergyForm from './components/Renewable/RenewableEnergyForm';
import RenewableAnalytics from './components/Renewable/RenewableAnalytics';
import { authService } from './services/authService';
import { ThemeProvider } from './contexts/ThemeContext';

// Initialize auth service
authService.init();

function App() {
  return (
    <ThemeProvider>
      <Router>
        <div className="app-shell min-h-screen transition-colors duration-300">
          <Navbar />
          <main className="relative z-10">
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
            
            {/* Consumption Route */}
            <Route path="/consumption" element={
              <PrivateRoute>
                <div className="container mx-auto px-4 py-8">
                  <div className="text-center">
                    <h1 className="text-2xl font-bold text-textPrimary dark:text-gray-200 mb-4">Energy Consumption</h1>
                    <p className="text-textSecondary dark:text-gray-400">Coming soon...</p>
                  </div>
                </div>
              </PrivateRoute>
            } />
            
            {/* Renewable Energy Routes */}
            <Route path="/renewable" element={
              <PrivateRoute>
                <div className="container mx-auto px-4 py-8">
                  <RenewableDashboard />
                </div>
              </PrivateRoute>
            } />
            <Route path="/renewable/analytics" element={
              <PrivateRoute>
                <div className="container mx-auto px-4 py-8">
                  <RenewableAnalytics />
                </div>
              </PrivateRoute>
            } />
            <Route path="/renewable/sources" element={
              <PrivateRoute>
                <div className="container mx-auto px-4 py-8">
                  <RenewableSource />
                </div>
              </PrivateRoute>
            } />
            <Route path="/renewable/records" element={
              <PrivateRoute>
                <div className="container mx-auto px-4 py-8">
                  <RenewableEnergyForm />
                </div>
              </PrivateRoute>
            } />
            <Route path="/renewable/records/new" element={
              <PrivateRoute>
                <div className="container mx-auto px-4 py-8">
                  <RenewableEnergyForm />
                </div>
              </PrivateRoute>
            } />
            
            {/* Devices Route */}
            <Route path="/devices" element={
              <PrivateRoute>
                <div className="container mx-auto px-4 py-8">
                  <div className="text-center">
                    <h1 className="text-2xl font-bold text-textPrimary dark:text-gray-200 mb-4">Device Management</h1>
                    <p className="text-textSecondary dark:text-gray-400">Coming soon...</p>
                  </div>
                </div>
              </PrivateRoute>
            } />
          </Routes>
          </main>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
