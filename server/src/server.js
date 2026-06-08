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

// New Imports
const { v4: uuidv4 } = require('uuid');
const hpp = require('hpp');
const mongoSanitize = require('express-mongo-sanitize');
const winston = require('winston');

// Ensure storage directory exists
const logDir = path.join(__dirname, 'storage');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);

// Setup Logger: Writing to file
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: path.join(logDir, 'app.log') })
  ]
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

  if (process.env.NODE_ENV === 'production') app.set('trust proxy', 1);

  // Security Middleware
  app.use(helmet());
  app.use(cors());
  app.use(compression());
  app.use(express.json({ limit: '10kb' }));
  
  app.use((req, res, next) => {
    req.id = req.headers['x-request-id'] || uuidv4();
    res.setHeader('x-request-id', req.id);
    next();
  });

  app.use(hpp());
  app.use(mongoSanitize());

  if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

  app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

  // RESTORED: Detailed Health Check
  app.get('/health', (req, res) => {
    const dbStatus = mongoose.connection.readyState === 1 ? 'UP' : 'DOWN';
    const healthStatus = {
      status: dbStatus === 'UP' ? 'OK' : 'DEGRADED',
      timestamp: new Date().toISOString(),
      workerPid: process.pid,
      memoryUsage: process.memoryUsage()
    };
    res.status(dbStatus === 'UP' ? 200 : 503).json(healthStatus);
  });

  app.use('/api', apiRouter);

  // Global Error Handler
  app.use((err, req, res, next) => {
    logger.error(`Error [${req.id}]: ${err.message}`);
    res.status(err.statusCode || 500).json({ status: 'error', message: err.message });
  });

  mongoose.connect(process.env.MONGODB_URI, { maxPoolSize: 50 })
    .then(() => {
      logger.info(`Worker ${process.pid} connected to DB.`);
      const server = app.listen(process.env.PORT || 5000);

      process.on('SIGTERM', () => {
        logger.info(`Worker ${process.pid} closing.`);
        server.close(() => mongoose.connection.close(() => process.exit(0)));
      });
    })
    .catch(err => {
      logger.error('DB Connection Error:', err);
      process.exit(1);
    });
}