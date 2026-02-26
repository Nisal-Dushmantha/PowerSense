import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from 'antd';
import ConsumptionList from './ConsumptionList';
import ConsumptionForm from './ConsumptionForm';
import ConsumptionStats from './ConsumptionStats';

const { Content } = Layout;

const EnergyConsumption = () => {
  return (
    <Content style={{ padding: '24px' }}>
      <Routes>
        <Route path="/" element={<Navigate to="/energy-consumption/list" replace />} />
        <Route path="/list" element={<ConsumptionList />} />
        <Route path="/stats" element={<ConsumptionStats />} />
        <Route path="/new" element={<ConsumptionForm />} />
        <Route path="/edit/:id" element={<ConsumptionForm />} />
      </Routes>
    </Content>
  );
};

export default EnergyConsumption;
