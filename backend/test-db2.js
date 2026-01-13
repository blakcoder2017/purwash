require('dotenv').config();
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    console.log('Attempting to connect to MongoDB...');
    console.log('URI:', process.env.MONGO_URI ? 'SET' : 'NOT SET');
    
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // Add connection options for newer mongoose versions
      bufferCommands: false,
    });
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error('Connection error details:', {
      name: err.name,
      message: err.message,
      stack: err.stack
    });
    process.exit(1);
  }
};

connectDB();
