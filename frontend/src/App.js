import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import BillList from './components/energyReports/BillList';
import CreateBill from './components/energyReports/CreateBill';
import EditBill from './components/energyReports/EditBill';
import BillStats from './components/energyReports/BillStats';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected Routes */}
            <Route path="/" element={<Navigate to="/bills" />} />
            <Route path="/bills" element={
              <PrivateRoute>
                <BillList />
              </PrivateRoute>
            } />
            <Route path="/bills/new" element={
              <PrivateRoute>
                <CreateBill />
              </PrivateRoute>
            } />
            <Route path="/bills/edit/:id" element={
              <PrivateRoute>
                <EditBill />
              </PrivateRoute>
            } />
            <Route path="/stats" element={
              <PrivateRoute>
                <BillStats />
              </PrivateRoute>
            } />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
