const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/app');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to DB
connectDB();

// Routes
app.use('/api/devices', require('./routes/devices'));

// Basic health route
app.get('/', (req, res) => {
  res.json({ message: 'PowerSense Backend API is running!', status: 'ok' });
});

module.exports = app;
