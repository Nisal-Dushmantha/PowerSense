const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    // Set mongoose options
    mongoose.set('strictQuery', false);

    const mongoUri = process.env.MONGO_URI || 'mongodb+srv://PowerSense:Powersense@cluster0.s2xc238.mongodb.net/powersense?retryWrites=true&w=majority';
    
    const conn = await mongoose.connect(mongoUri);
    
    const conn = await mongoose.connect("mongodb+srv://PowerSense:Powersense@cluster0.s2xc238.mongodb.net/powersense?retryWrites=true&w=majority");

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`Database Name: ${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    console.error('Full error:', error);
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
