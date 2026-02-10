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
import BillStats from './components/energyReports/BillStats';
import RenewableDashboard from './components/Renewable/RenewableDashboard';
import RenewableSource from './components/Renewable/RenewableSource';
import RenewableEnergyForm from './components/Renewable/RenewableEnergyForm';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background">
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
          
          {/* Renewable Energy Routes */}
          <Route path="/renewable" element={
            <PrivateRoute>
              <div className="container mx-auto px-4 py-8">
                <RenewableDashboard />
              </div>
            </PrivateRoute>
          } />
          <Route path="/renewable/dashboard" element={
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
        </Routes>
      </div>
    </Router>
  );
}

export default App;
