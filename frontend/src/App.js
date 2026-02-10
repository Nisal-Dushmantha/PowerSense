import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from 'antd';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';

// Energy Reports Components
import PrivateRoute from './components/PrivateRoute';
import Home from './components/Home';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import BillList from './components/energyReports/BillList';
import CreateBill from './components/energyReports/CreateBill';
import EditBill from './components/energyReports/EditBill';
import BillStats from './components/energyReports/BillStats';

// Energy Consumption Components
import EnergyConsumption from './components/energyConsumption';

const { Content } = Layout;

function App() {
  return (
    <Router>
      <Layout className="min-h-screen bg-gray-50">
        <Navbar />
        <Content style={{ padding: '24px' }}>
          <div className="container mx-auto">
            <Routes>
              {/* Root redirect */}
              <Route path="/" element={<Navigate to="/bills" replace />} />
              
              {/* Energy Reports Routes */}
              <Route path="/bills" element={<BillList />} />
              <Route path="/bills/new" element={<CreateBill />} />
              <Route path="/bills/edit/:id" element={<EditBill />} />
              <Route path="/stats" element={<BillStats />} />
              
              {/* Energy Consumption Routes */}
              <Route path="/energy-consumption/*" element={<EnergyConsumption />} />
              
              {/* 404 - Keep this last */}
              <Route path="*" element={<Navigate to="/bills" replace />} />
            </Routes>
          </div>
        </Content>
      </Layout>
        <div className="container mx-auto px-4 py-8">
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected Routes */}
            <Route path="/" element={<Navigate to="/bills" />} />
            <Route path="/bills" element={
              <PrivateRoute>
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
