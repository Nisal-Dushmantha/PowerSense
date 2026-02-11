import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ConsumptionList from './ConsumptionList';
import ConsumptionStats from './ConsumptionStats';

const EnergyConsumption = () => {
  return (
    <div className="container mx-auto px-6 py-8">
      <Routes>
        <Route path="/" element={<ConsumptionList />} />
        <Route path="/list" element={<ConsumptionList />} />
        <Route path="/stats" element={<ConsumptionStats />} />
      </Routes>
    </div>
  );
};

export default EnergyConsumption;
