const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const path = require('path');

dotenv.config();

// Initialize PostgreSQL database (src copy)
const { initializeDatabase } = require('./src/shared/utils/database');

// Initialize database schema only outside production (migrations run separately on Vercel)
if (process.env.NODE_ENV !== 'production') {
  initializeDatabase().catch(err => {
    console.error('Failed to initialize database:', err);
  });
}

const app = express();

// Enable CORS for all routes and static files
const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: false
};

app.use(cors(corsOptions));
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(express.json());

// Serve static files (maps and floor plans)
app.use('/maps', express.static(path.join(__dirname, 'public')));
app.use('/floor-plans', express.static(path.join(__dirname, 'public')));

// apply rate limiter to all API routes
const { apiLimiter } = require('./src/middleware/rateLimiter');
app.use('/api', apiLimiter);

app.get('/api/ping', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

function tryMountRoute(routePath, modulePath) {
  try {
    app.use(routePath, require(modulePath));
  } catch (err) {
    console.warn(`Skipping ${routePath}: ${err.message}`);
  }
}

// Mount routes
tryMountRoute('/api/auth', './src/routes/auth');
tryMountRoute('/api/navigation', './src/routes/navigation');
tryMountRoute('/api/locations', './src/routes/locations');
tryMountRoute('/api/maps', './src/routes/maps');
tryMountRoute('/api/floor-plans', './src/modules/floorPlans/routes');

module.exports = app;
