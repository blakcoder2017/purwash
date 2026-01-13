const express = require('express');
const morgan = require('morgan');

const AppError = require('./utils/appError.js');
const globalErrorHandler = require('./controllers/errorController');
const cors = require('cors');
const helmet = require('helmet');

const clientRoutes = require('./routes/clients');
const manageRoutes = require('./routes/manage');
const paystackRoutes = require('./routes/paystack');
const webhookRoutes = require('./routes/webhook');
const userRoutes = require('./routes/userRoutes');
const orderRoutes = require('./routes/orderRoutes');
const adminRoutes = require('./routes/adminRoutes');
const laundryItemRoutes = require('./routes/laundryItemRoutes');
const authRoutes = require('./routes/auth');

const app = express();

// 1) GLOBAL SECURITY HEADERS
app.use(helmet());

// 2) CORS CONFIGURATION
const corsOptions = {
  origin: [
    'http://localhost:3000',  // Client app
    'http://localhost:3001',  // Admin app
    'http://localhost:3002',  // Partner app
    'http://localhost:3003',  // Rider app
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:3002',
    'http://127.0.0.1:3003'
  ],
  credentials: true,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-secret'],
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Apply CORS globally
app.use(cors(corsOptions));

// Handle preflight OPTIONS requests safely for all routes
app.options('/*', cors(corsOptions));

// 3) BODY PARSER
app.use(express.json());

// 4) REQUEST TIMESTAMP
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// 5) LOGGING IN DEV
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// 6) ROUTES
app.use('/api/auth', authRoutes);
app.use('/api/v1/client', clientRoutes);
app.use('/api/v1/manage', manageRoutes);
app.use('/api/v1/payments', paystackRoutes);
app.use('/api/users', userRoutes);   // All partner routes
app.use('/api/orders', orderRoutes); // All order routes
app.use('/api/admin', adminRoutes);
app.use('/api/catalog', laundryItemRoutes); // Laundry catalog routes

// 7) HEALTH CHECK
app.get('/', (req, res) => res.send('weWash API is live 🚀'));

// 8) FAVICON
app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

// 9) 404 HANDLER (catch-all)
app.all('/*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// 10) GLOBAL ERROR HANDLER
app.use(globalErrorHandler);

module.exports = app;
