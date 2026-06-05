// src/server.js
require('dotenv').config();
const cluster = require('cluster');
const os = require('os');
const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');   
const cors = require('cors');       
const morgan = require('morgan');   
const compression = require('compression'); 
const rateLimit = require('express-rate-limit'); 

// ==========================================
// 1. PRIMARY PROCESS: Core Spawner
// ==========================================
if (cluster.isPrimary) {
  const numCPUs = os.cpus().length;
  console.log(` Primary System Process ${process.pid} is running.`);
  console.log(` Forking application across ${numCPUs} CPU cores...`);

  // Fork a worker for each CPU core
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  // Restart workers if they crash unexpectedly
  cluster.on('exit', (worker, code, signal) => {
    console.error(` Worker process ${worker.process.pid} died (Code: ${code}, Signal: ${signal}). Spawning replacement...`);
    cluster.fork();
  });

} else {
  // ==========================================
  // 2. WORKER PROCESS: Actual Express Instance
  // ==========================================
  const app = express();
  const apiRouter = require('./modules/index.routes');

  // Trust upstream reverse proxy (Nginx, AWS ALB, Cloudflare) for accurate rate limiting
  if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
  }

  // Global Security & Optimization Middleware
  app.use(helmet());
  app.use(cors());
  app.use(compression()); 
  app.use(express.json({ limit: '10kb' })); // Anti-payload bloating limit

  if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev')); 
  }

  // Production-optimized Rate Limiter
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 100, 
    message: { error: 'Too many requests from this IP, please try again later.' },
    standardHeaders: true, 
    legacyHeaders: false, 
  });
  app.use('/api/', limiter);

  //  Detailed Health Check Endpoint
  app.get('/health', (req, res) => {
    const dbStatus = mongoose.connection.readyState === 1 ? 'UP' : 'DOWN';
    
    const healthStatus = {
      status: dbStatus === 'UP' ? 'OK' : 'DEGRADED',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      uptime: `${process.uptime().toFixed(2)}s`,
      workerPid: process.pid, // Identifies which worker handled the check
      services: { database: dbStatus, server: 'UP' },
      system: {
        memoryUsage: {
          rss: `${(process.memoryUsage().rss / 1024 / 1024).toFixed(2)} MB`,
          heapTotal: `${(process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2)} MB`,
          heapUsed: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`
        }
      }
    };

    res.status(dbStatus === 'UP' ? 200 : 503).json(healthStatus);
  });

  //  Application Routes
  app.use('/api', apiRouter);

  //  Centralized Global Error Handling Middleware
  app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
      status: 'error',
      message: err.message || 'Internal Server Error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  });

  //  Database Connection with Pool Tuning
  if (!process.env.MONGODB_URI) {
    console.error(' CRITICAL ERROR: MONGODB_URI is undefined.');
    process.exit(1);
  }

  const mongooseOptions = {
    maxPoolSize: 50,           // Up to 50 concurrent DB connections per worker
    minPoolSize: 10,           // Keeps 10 connections warm
    socketTimeoutMS: 45000, 
    serverSelectionTimeoutMS: 5000, 
  };

  mongoose.connect(process.env.MONGODB_URI, mongooseOptions)
    .then(() => {
      console.log(` Worker ${process.pid} connected to MongoDB.`);
      // Start server only after successful DB connection
      const PORT = process.env.PORT || 5000;
      const server = app.listen(PORT, () => {
        console.log(` Worker ${process.pid} listening on port ${PORT}`);
      });

      //  Graceful Shutdown Logic
      process.on('SIGTERM', () => {
        console.log(` Worker ${process.pid} received SIGTERM. Closing down...`);
        server.close(() => {
          mongoose.connection.close(false, () => {
            console.log(` Worker ${process.pid} database connection closed.`);
            process.exit(0);
          });
        });
      });

      process.on('unhandledRejection', (err) => {
        console.error(` Unhandled Rejection in Worker ${process.pid}:`, err);
        server.close(() => process.exit(1));
      });

    })
    .catch(err => {
      console.error(` Worker ${process.pid} DB Connection Error:`, err.message);
      process.exit(1);
    });
}