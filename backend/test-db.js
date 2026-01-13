require('dotenv').config();
const mongoose = require('mongoose');

// Try with a simpler connection string to test
const testURI = 'mongodb://localhost:27017/test';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(testURI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
};

connectDB();
