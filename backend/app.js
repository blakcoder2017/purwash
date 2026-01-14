const express = require('express');
const morgan = require('morgan');

const AppError = require('./utils/appError.js');
const globalErrorHandler = require('./controllers/errorController');
const cors = require('cors');
const helmet = require('helmet');


const manageRoutes = require('./routes/manage');
const paystackRoutes = require('./routes/paystack');
const webhookRoutes = require('./routes/webhook');
const userRoutes = require('./routes/userRoutes');
const orderRoutes = require('./routes/orderRoutes');
const clientRoutes = require('./routes/clientRoutes');
const adminRoutes = require('./routes/adminRoutes');
const laundryItemRoutes = require('./routes/laundryItemRoutes');
const authRoutes = require('./routes/auth');
const partnerRegistrationRoutes = require('./routes/partnerRegistration');

const app = express();

// 1) GLOBAL SECURITY HEADERS
app.use(helmet());

// 2) CORS CONFIGURATION
const corsOptions = {
  origin: true,
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
  optionsSuccessStatus: 204,
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
app.use('/api/partner-registration', partnerRegistrationRoutes);

app.use('/api/v1/manage', manageRoutes);
app.use('/api/v1/payments', paystackRoutes);
app.use('/api/users', userRoutes); // Added back
// app.use('/api/orders', orderRoutes); // Temporarily commented
app.use('/api/clients', clientRoutes); // Added back
app.use('/api/admin', adminRoutes); // Admin routes (protected)
app.use('/api/catalog', laundryItemRoutes); // Added back
app.use('/api/webhook', webhookRoutes); // Webhook routes
app.use('/api/wallet', require('./routes/walletRoutes')); // Added back


// 7) HEALTH CHECK
app.get('/', (req, res) => res.send('weWash API is live '));

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
