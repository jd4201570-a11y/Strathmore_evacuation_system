const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');

dotenv.config();

// Initialize PostgreSQL database (src copy)
const { initializeDatabase } = require('./src/shared/utils/database');

// Initialize database before creating app
initializeDatabase().catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});

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
app.use('/maps', express.static('./public'));
app.use('/floor-plans', express.static('./public'));

// apply rate limiter to all API routes
const { apiLimiter } = require('./src/middleware/rateLimiter');
app.use('/api', apiLimiter);

app.get('/api/ping', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Mount routes
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/navigation', require('./src/routes/navigation'));
app.use('/api/locations', require('./src/routes/locations'));
app.use('/api/maps', require('./src/routes/maps'));
app.use('/api/floor-plans', require('./src/modules/floorPlans/routes'));

module.exports = app;
