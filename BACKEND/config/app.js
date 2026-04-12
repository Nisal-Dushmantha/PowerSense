const mongoose = require('mongoose');
const path = require('path');
const dns = require('dns');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const connectDB = async () => {
  try {
    // Set mongoose options
    mongoose.set('strictQuery', false);
    const mongoUri = process.env.MONGO_URI;

    if (!mongoUri) {
      throw new Error('MONGO_URI is not set. Please add it to BACKEND/.env');
    }
    
    let conn;

    try {
      conn = await mongoose.connect(mongoUri);
    } catch (error) {
      const isSrvLookupFailure =
        String(error.code || '') === 'ENOTFOUND' && String(error.syscall || '') === 'querySrv';
      const usesSrvUri = String(mongoUri).startsWith('mongodb+srv://');

      if (!isSrvLookupFailure || !usesSrvUri) {
        throw error;
      }

      console.error('Initial SRV DNS lookup failed on local resolver. Retrying with public DNS servers...');
      dns.setServers(['8.8.8.8', '1.1.1.1']);
      conn = await mongoose.connect(mongoUri);
    }

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`Database Name: ${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    console.error('Full error:', error);

    if (String(error.message || '').includes('ENOTFOUND')) {
      console.error('DNS resolution failed for MongoDB Atlas host.');
      console.error('Try changing your network DNS to 8.8.8.8 / 8.8.4.4 or 1.1.1.1 / 1.0.0.1, then run: ipconfig /flushdns');
      console.error('You can verify with: nslookup ac-bscuvdd-shard-00-00.s2xc238.mongodb.net 8.8.8.8');
    }

    process.exit(1);
  }
};

// Handle connection events
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected');
});

// Close connection on app termination
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed due to app termination');
  process.exit(0);
});

module.exports = connectDB;
