import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
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
            <Route path="/" element={<Navigate to="/bills" />} />
            <Route path="/bills" element={<BillList />} />
            <Route path="/bills/new" element={<CreateBill />} />
            <Route path="/bills/edit/:id" element={<EditBill />} />
            <Route path="/stats" element={<BillStats />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
