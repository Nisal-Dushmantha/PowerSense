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
        </Routes>
      </div>
    </Router>
  );
}

export default App;
