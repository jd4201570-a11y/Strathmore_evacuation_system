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

// Mount routes with static imports so serverless bundlers include all modules.
const authRoutes = require('./src/routes/auth');
const navigationRoutes = require('./src/routes/navigation');
const locationsRoutes = require('./src/routes/locations');
const mapsRoutes = require('./src/routes/maps');
const floorPlansRoutes = require('./src/modules/floorPlans/routes');

app.use('/api/auth', authRoutes);
app.use('/api/navigation', navigationRoutes);
app.use('/api/locations', locationsRoutes);
app.use('/api/maps', mapsRoutes);
app.use('/api/floor-plans', floorPlansRoutes);

module.exports = app;
