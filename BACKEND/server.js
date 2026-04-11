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

// Connect to database
connectDB();
startMaintenanceStatusScheduler();

// Import routes
const monthlyBillRoutes = require('./routes/monthlyBill');
//const energyConsumptionRoutes = require('./routes/energyConsumption');
const authRoutes = require('./routes/auth');
const renewableRoutes = require('./routes/renewableRoutes');
const { startBillReminderJob } = require('./jobs/billReminderJob');
const { initializeWhatsAppClient } = require('./services/whatsappOtpService');

// Basic route
app.get('/', (req, res) => {
  res.json({ 
    message: 'PowerSense Backend API is running!',
    status: 'Connected to MongoDB',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'connecting',
    endpoints: {
      bills: '/api/bills'
      //energy: '/api/energy-consumption'
    }
  });
});

// API Routes
app.use('/api/bills', monthlyBillRoutes);
//app.use('/api/energy-consumption', energyConsumptionRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/renewable', renewableRoutes);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`🌐 API URL: http://localhost:${PORT}`);
});

module.exports = app;
