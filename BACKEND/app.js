const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

const monthlyBillRoutes = require('./routes/monthlyBill');
const energyConsumptionRoutes = require('./routes/energyConsumption');
const authRoutes = require('./routes/auth');
const devicesRoutes = require('./routes/devices');
const renewableRoutes = require('./routes/renewableRoutes');
const energyAnalyticsRoutes = require('./routes/energyAnalytics');
const dashboardRoutes = require('./routes/dashboard');
const adminRoutes = require('./routes/admin');

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'PowerSense Backend API is running!',
    data: {
      database: mongoose.connection.readyState === 1 ? 'connected' : 'connecting',
      endpoints: {
        auth: '/api/auth',
        bills: '/api/bills',
        consumption: '/api/energy-consumption',
        analytics: '/api/energy-analytics',
        devices: '/api/devices',
        renewable: '/api/renewable',
        dashboard: '/api/dashboard',
        admin: '/api/admin'
      }
    }
  });
});

app.use('/api/bills', monthlyBillRoutes);
app.use('/api/energy-consumption', energyConsumptionRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/devices', devicesRoutes);
app.use('/api/renewable', renewableRoutes);
app.use('/api/energy-analytics', energyAnalyticsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
