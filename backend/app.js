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
const walletRoutes = require('./routes/walletRoutes');
const cronRoutes = require('./routes/cronRoutes');

const app = express();

// 1) GLOBAL SECURITY HEADERS
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        'script-src': ["'self'", 'https://api.paystack.co', 'https://js.paystack.co', 'https://checkout.paystack.co'],
        'script-src-elem': ["'self'", 'https://api.paystack.co', 'https://js.paystack.co', 'https://checkout.paystack.co'],
        'connect-src': ["'self'", 'https://api.paystack.co', 'https://checkout.paystack.co'],
        'frame-src': ["'self'", 'https://checkout.paystack.co'],
      },
    },
  })
);

// 2) CORS CONFIGURATION
const allowedOrigins = new Set([
  'http://localhost:3000',  // Client app
  'http://localhost:3001',  // Admin app
  'http://localhost:3002',  // Partner app
  'http://localhost:3003',  // Rider app
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:3002',
  'http://127.0.0.1:3003'
]);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }
    if (allowedOrigins.has(origin) || origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
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

// #region agent log
app.use((req, res, next) => {
  const startTime = Date.now();
  res.on('finish', () => {
    fetch('http://127.0.0.1:7243/ingest/d4f0130a-59ab-40d3-81c4-822ff2880a92', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'debug-session',
        runId: 'pre-fix',
        hypothesisId: 'H1',
        location: 'backend/app.js:78',
        message: 'api_request_completed',
        data: {
          method: req.method,
          path: req.originalUrl,
          status: res.statusCode,
          durationMs: Date.now() - startTime
        },
        timestamp: Date.now()
      })
    }).catch(() => {});
  });
  next();
});
// #endregion

// 5) LOGGING IN DEV
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// 6) ROUTES
app.use('/api/auth', authRoutes);
app.use('/api/partner-registration', partnerRegistrationRoutes);

app.use('/api/v1/manage', manageRoutes);
app.use('/api/v1/payments', paystackRoutes);
app.use('/api/users', userRoutes); // Temporarily commented
app.use('/api/orders', orderRoutes); // Temporarily commented
app.use('/api/clients', clientRoutes);
app.use('/api/admin', adminRoutes); // Admin routes (protected)
app.use('/api/catalog', laundryItemRoutes); // Temporarily commented
app.use('/api/webhook', webhookRoutes); // Webhook routes
app.use('/api/wallet', walletRoutes); // Temporarily commented
app.use('/api/cron', cronRoutes);


// 7) HEALTH CHECK
app.get('/', (req, res) => res.send('weWash API is live '));

// 8) PAYSTACK CONFIG ENDPOINT
app.get('/api/config/paystack', (req, res) => {
  res.json({
    success: true,
    data: {
      publicKey: process.env.PAYSTACK_PUBLIC_KEY || 'pk_test_d89784309f0d8ce5fefdae351b531cecc1c9fa6d'
    }
  });
});

// 9) FAVICON
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
