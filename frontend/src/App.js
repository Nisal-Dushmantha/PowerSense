import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import BillList from './components/energyReports/BillList';
import CreateBill from './components/energyReports/CreateBill';
import EditBill from './components/energyReports/EditBill';
import BillStats from './components/energyReports/BillStats';
import DevicesList from './components/Devices/DevicesList';
import CreateDevice from './components/Devices/CreateDevice';
import EditDevice from './components/Devices/EditDevice';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Navigate to="/bills" />} />
            <Route path="/bills" element={<BillList />} />
            <Route path="/bills/new" element={<CreateBill />} />
            <Route path="/bills/edit/:id" element={<EditBill />} />
            <Route path="/stats" element={<BillStats />} />
            <Route path="/devices" element={<DevicesList />} />
            <Route path="/devices/new" element={<CreateDevice />} />
            <Route path="/devices/edit/:id" element={<EditDevice />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
