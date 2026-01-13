require('dotenv').config();
const express = require('express');
// const connectDB = require('./config/db'); // Temporarily disabled

const app = express();

// Basic middleware
app.use(express.json());

// Database Connection
// connectDB(); // Temporarily disabled

// Health check
app.get('/', (req, res) => res.send('Server is running without DB'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
