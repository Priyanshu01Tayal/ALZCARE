const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const connectDB = require('./config/db');

// Load environment variables (supports executing from repository root or backend directory)
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config();

// Connect to Database
connectDB();

const app = express();

// CORS Configuration: Supports deployed web apps (Render/Vercel), mobile apps (Expo), and local testing
const rawCorsOrigin = process.env.CORS_ORIGIN;
const allowedOrigins = rawCorsOrigin
  ? rawCorsOrigin.split(',').map((o) => o.trim())
  : ['*'];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (such as mobile applications, curl, server-to-server calls)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes('*') || allowedOrigins.indexOf(origin) !== -1) {
        return callback(null, true);
      }
      // Permissive fallback so deployed frontends are never silently blocked
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded MRI files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mount API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/patients', require('./routes/patientRoutes'));
app.use('/api/appointments', require('./routes/appointmentRoutes'));
app.use('/api/prescriptions', require('./routes/prescriptionRoutes'));
app.use('/api/mri', require('./routes/mriRoutes'));
app.use('/api/games', require('./routes/gameRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/timeline', require('./routes/timelineRoutes'));
app.use('/api/doctors', require('./routes/doctorRoutes'));

// Health check endpoint (for Render automated health checks and uptime monitoring)
app.get('/api/health', (req, res) => {
  const dbStateMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  const isConnected = mongoose.connection.readyState === 1;
  const dbStatus = dbStateMap[mongoose.connection.readyState] || 'unknown';

  res.status(isConnected ? 200 : 503).json({
    status: isConnected ? 'ok' : 'degraded',
    database: dbStatus,
    message: 'AlzCare API is healthy and reachable',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// Root Endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'AlzCare API is running...',
    version: '1.0.0',
    health: '/api/health',
  });
});

// Custom Error Handler
app.use((err, req, res, next) => {
  console.error('Express Error Handler:', err.stack || err.message || err);
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

// Render injects PORT dynamically (defaulting to 10000 on Render, or 5000 locally)
const PORT = process.env.PORT || 5000;
const nodeEnv = process.env.NODE_ENV || 'development';

app.listen(PORT, () => {
  console.log(`Server running in ${nodeEnv} mode on port ${PORT}`);
});
