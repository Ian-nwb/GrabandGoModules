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
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const hpp = require('hpp');
const mongoSanitize = require('express-mongo-sanitize');
const winston = require('winston');
require('winston-daily-rotate-file'); // Required for rotation

// Ensure storage directory exists
const logDir = path.join(__dirname, 'storage');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);

// Setup Logger: Daily Rotation
const transport = new winston.transports.DailyRotateFile({
  filename: path.join(logDir, 'app-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d'
});

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console(), transport]
});

// Global Uncaught Exception Handler
process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION! Shutting down...', { message: err.message, stack: err.stack });
  process.exit(1);
});

if (cluster.isPrimary) {
  const numCPUs = os.cpus().length;
  logger.info(`Primary System Process ${process.pid} is running.`);
  for (let i = 0; i < numCPUs; i++) cluster.fork();

  cluster.on('exit', (worker) => {
    logger.error(`Worker ${worker.process.pid} died. Spawning replacement...`);
    cluster.fork();
  });
} else {
  const app = express();
  const apiRouter = require('./modules/index.routes');

  // Security Middleware
  app.use(helmet());
  app.use(cors());
  app.use(compression());
  app.use(express.json({ limit: '10kb' }));
  
  app.use((req, res, next) => {
    req.id = uuidv4();
    res.setHeader('x-request-id', req.id);
    next();
  });

  app.use(hpp());
  app.use(mongoSanitize());
  if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

  app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

  // Health Check
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', pid: process.pid, memory: process.memoryUsage() });
  });

  app.use('/api', apiRouter);

  // Global Error Handler
  app.use((err, req, res, next) => {
    logger.error(`Error [${req.id}]: ${err.message}`);
    res.status(err.statusCode || 500).json({ status: 'error', message: err.message });
  });

  mongoose.connect(process.env.MONGODB_URI, { maxPoolSize: 50 })
    .then(() => {
      const server = app.listen(process.env.PORT || 5000);
      process.on('SIGTERM', () => server.close(() => process.exit(0)));
    });
}