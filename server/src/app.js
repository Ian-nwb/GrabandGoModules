// src/app.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');   
const cors = require('cors');       
const morgan = require('morgan');   
const compression = require('compression'); // ⚡ Optimized payload sizing
const rateLimit = require('express-rate-limit'); // 🛑 Anti-brute force

// 🤖 Load the Master Automated Router
const apiRouter = require('./modules/index.routes');

const app = express();

// Global Security, Optimization & Logging Middleware
app.use(helmet());
app.use(cors());
app.use(compression()); 

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev')); 
}

// Rate limiting setup (Example: Max 100 requests every 15 minutes per IP)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  message: { error: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true, 
  legacyHeaders: false, 
});
app.use('/api/', limiter); // Apply rate limiter to all API endpoints

app.use(express.json());

// 🩺 Detailed Health Check Endpoint
app.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'UP' : 'DOWN';
  
  const healthStatus = {
    status: dbStatus === 'UP' ? 'OK' : 'DEGRADED',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: `${process.uptime().toFixed(2)}s`,
    services: {
      database: dbStatus,
      server: 'UP'
    },
    system: {
      memoryUsage: {
        rss: `${(process.memoryUsage().rss / 1024 / 1024).toFixed(2)} MB`,
        heapTotal: `${(process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2)} MB`,
        heapUsed: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`
      }
    }
  };

  const statusCode = dbStatus === 'UP' ? 200 : 503;
  res.status(statusCode).json(healthStatus);
});

// 🚀 One Single Route Connection Point for All Modules
app.use('/api', apiRouter);

// MongoDB connection
if (!process.env.MONGODB_URI) {
  console.error('❌ CRITICAL ERROR: MONGODB_URI is not defined in .env file.');
  process.exit(1);
}

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('🌿 MongoDB Connected Successfully...'))
  .catch(err => {
    console.error('❌ DB Connection Error:');
    console.error(err.message);
  });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});