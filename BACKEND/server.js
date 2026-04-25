const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/app');
const { startMaintenanceStatusScheduler } = require('./services/maintenanceScheduler');

dotenv.config();

// Initialize express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (uploaded images)
app.use('/uploads', express.static('uploads'));

// Import routes
const monthlyBillRoutes = require('./routes/monthlyBill');
const authRoutes = require('./routes/auth');
const devicesRoutes = require('./routes/devices');
const energyConsumptionRoutes = require('./routes/energyConsumption');
const renewableRoutes = require('./routes/renewableRoutes');
const { startBillReminderJob } = require('./jobs/billReminderJob');
const { initializeWhatsAppClient } = require('./services/whatsappOtpService');
const energyAnalyticsRoutes = require('./routes/energyAnalytics');
// Basic route
app.get('/', (req, res) => {
  res.json({
    message: 'PowerSense Backend API is running!',
    status: 'Connected to MongoDB',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'connecting',
    endpoints: {
      bills: '/api/bills',
      auth: '/api/auth',
      devices: '/api/devices',
      energy: '/api/energy-consumption',
      analytics: '/api/energy-analytics',
      renewable: '/api/renewable'
    }
  });
});

// API Routes
app.use('/api/bills', monthlyBillRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/devices', devicesRoutes);
app.use('/api/energy-consumption', energyConsumptionRoutes);
app.use('/api/energy-analytics', energyAnalyticsRoutes);
app.use('/api/renewable', renewableRoutes);

const PORT = process.env.PORT || 5001;

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`🌐 API URL: http://localhost:${PORT}`);

    // Start scheduled jobs/services only after DB is connected.
    startBillReminderJob();
    startMaintenanceStatusScheduler();
    initializeWhatsAppClient();
  });
};

startServer().catch((error) => {
  console.error('Failed to start server:', error.message);
  process.exit(1);
});

module.exports = app;
