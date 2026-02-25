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
import { authService } from './services/authService';
import { ThemeProvider } from './contexts/ThemeContext';

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
            
            {/* Placeholder routes for new nav items */}
            <Route path="/consumption" element={
              <PrivateRoute>
                <div className="container mx-auto px-4 py-8">
                  <BillStats />
                </div>
              </PrivateRoute>
            } />
            <Route path="/renewable" element={
              <PrivateRoute>
                <div className="container mx-auto px-4 py-8">
                  <RenewableDashboard />
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
            
            <Route path="/devices" element={
              <PrivateRoute>
                  <div className="container mx-auto px-4 py-8">
                    <DevicesList />
                  </div>
              </PrivateRoute>
            } />
            <Route path="/devices/charts" element={
              <PrivateRoute>
                <DeviceChartsPage />
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
