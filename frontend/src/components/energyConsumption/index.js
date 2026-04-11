import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ConsumptionList from './ConsumptionList';
import ConsumptionStats from './ConsumptionStats';
import EnergyAnalytics from './EnergyAnalytics';

const EnergyConsumption = () => {
  return (
    <div className="container mx-auto px-6 py-8">
      <Routes>
        <Route path="/"          element={<ConsumptionList />} />
        <Route path="/list"      element={<ConsumptionList />} />
        <Route path="/stats"     element={<ConsumptionStats />} />
        <Route path="/analytics" element={<EnergyAnalytics />} />
      </Routes>
    </div>
  );
};

export default EnergyConsumption;
