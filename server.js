const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import routes
const questionnaireRoutes = require('./routes/questionnaire');
const demoRoutes = require('./routes/demo');
const leadRoutes = require('./routes/leads');
const analyticsRoutes = require('./routes/analytics');
const healthRoutes = require('./routes/health');

// Import middleware
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { authenticate } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ----------------------
// Security Middleware
// ----------------------
app.use(
  helmet({
    contentSecurityPolicy: NODE_ENV === 'production' ? {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    } : false // disable CSP in dev (to avoid blocking React dev scripts)
  })
);

// ----------------------
// Rate Limiting
// ----------------------
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// ----------------------
// CORS Configuration
// ----------------------
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

// ----------------------
// Middleware
// ----------------------
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('combined'));

// ----------------------
// API Routes
// ----------------------
app.use('/api/health', healthRoutes);
app.use('/api/questionnaire', questionnaireRoutes);
app.use('/api/demo', demoRoutes);
app.use('/api/leads', authenticate, leadRoutes);
app.use('/api/analytics', authenticate, analyticsRoutes);

// ----------------------
// Default Route
// ----------------------
app.get('/', (req, res) => {
  res.json({
    message: 'Framtt Backend API',
    version: '1.0.0',
    status: 'running',
    environment: NODE_ENV,
    endpoints: {
      health: '/api/health',
      questionnaire: '/api/questionnaire',
      demo: '/api/demo',
      leads: '/api/leads',
      analytics: '/api/analytics',
    },
  });
});

// ----------------------
// Error Handlers
// ----------------------
app.use(notFound);
app.use(errorHandler);

// ----------------------
// Start Server
// ----------------------
const server = app.listen(PORT, () => {
  console.log(`🚀 Framtt Backend API running on port ${PORT}`);
  console.log(`📊 Environment: ${NODE_ENV}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
});

// ----------------------
// Graceful Shutdown
// ----------------------
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  server.close(() => process.exit(0));
});

module.exports = app;
