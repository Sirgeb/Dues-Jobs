const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// Load environment variables
const envFile = process.env.NODE_ENV === 'production' ? 'prod.env' : 'dev.env';
require('dotenv').config({ path: path.join(__dirname, '..', envFile) });

// Also load standard .env as fallback if dev.env/prod.env aren't found or for common variables
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());

const whitelist = [
  'http://localhost:5173',
  'https://dues-jobs-client26.vercel.app',
];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      // Check if origin is in whitelist
      const isWhitelisted = whitelist.some((allowed) => {
        if (allowed.includes('*')) {
          // Handle wildcard domains
          const pattern = allowed.replace('*', '.*');
          return new RegExp(pattern).test(origin);
        }
        return allowed === origin;
      });

      if (isWhitelisted || process.env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        console.warn(`CORS blocked origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-cron-secret'],
  }),
);

app.use(morgan('dev'));
app.use(express.json());

// Routes
const authRoutes = require('./routes/auth');
const fetchRoutes = require('./routes/fetch');
const jobsRoutes = require('./routes/jobs');
const usersRoutes = require('./routes/users');

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/fetch', fetchRoutes);
app.use('/api/v1/jobs', jobsRoutes);
app.use('/api/v1/users', usersRoutes);

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// 404 Handler - Redirect to Frontend for non-api routes
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Not Found' });
  }
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  res.redirect(frontendUrl);
});

// Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

const telegramBot = require('./services/TelegramBotHandler');

const required = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_ANON_KEY',
  'CRON_SECRET',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASS',
  'EMAIL_FROM',
];

const missing = required.filter((key) => !process.env[key]);
if (missing.length) {
  console.error('Missing env vars:', missing.join(', '));
  process.exit(1);
}

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    const serverUrl = process.env.BACKEND_URL || `http://localhost:${PORT}`;
    console.log(`Server running on ${serverUrl}`);
    telegramBot.start();
  });
}

module.exports = app;
