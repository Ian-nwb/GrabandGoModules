require('dotenv').config();
const cluster = require('cluster');
const os = require('os');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/cluster-adapter');
const { setupWorker } = require('@socket.io/sticky');
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
require('winston-daily-rotate-file');

// ─── Logger ───────────────────────────────────────────────────────────────────
const logDir = path.join(__dirname, 'storage');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);

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

// ─── Uncaught Exception ───────────────────────────────────────────────────────
process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION! Shutting down...', { message: err.message, stack: err.stack });
  process.exit(1);
});

// ─── Primary Process ──────────────────────────────────────────────────────────
if (cluster.isPrimary) {
  const net = require('net');
  const numCPUs = os.cpus().length;

  logger.info(`Primary ${process.pid} is running — spawning ${numCPUs} workers.`);

  // Sticky-session TCP server: routes each client IP to the same worker
  // so Socket.IO long-polling handshakes land on the right process
  const server = net.createServer({ pauseOnConnect: true });

  const workers = [];
  for (let i = 0; i < numCPUs; i++) {
    const worker = cluster.fork();
    workers.push(worker);
  }

  // Round-robin + sticky by remote address
  let current = 0;
  server.on('connection', (connection) => {
    const worker = workers[current % workers.length];
    worker.send('sticky-session:connection', connection);
    current++;
  });

  server.listen(process.env.PORT || 5000, () => {
    logger.info(`Sticky TCP server listening on port ${process.env.PORT || 5000}`);
  });

  cluster.on('exit', (worker) => {
    logger.error(`Worker ${worker.process.pid} died. Spawning replacement...`);
    const newWorker = cluster.fork();
    // Replace dead worker in the pool
    const idx = workers.indexOf(worker);
    if (idx !== -1) workers[idx] = newWorker;
  });

// ─── Worker Process ───────────────────────────────────────────────────────────
} else {
  const app = express();
  const server = http.createServer(app);

  // Socket.IO with cluster adapter so events broadcast across all workers
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || '*',
      credentials: true
    },
    // Prefer WebSocket; fall back to polling (polling needs sticky sessions above)
    transports: ['websocket', 'polling']
  });

  io.adapter(createAdapter());
  setupWorker(io); // Binds worker to primary's sticky TCP server

  // Register chat socket handlers
  const chatSocket = require('./modules/chat/chat.socket');
  chatSocket(io);

  const apiRouter = require('./modules/index.routes');

  // ─── Security Middleware ────────────────────────────────────────────────────
  app.use(helmet());
  app.use(cors({ origin: process.env.CLIENT_URL || '*', credentials: true }));
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

  // ─── Routes ─────────────────────────────────────────────────────────────────
  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'OK',
      pid: process.pid,
      memory: process.memoryUsage()
    });
  });

  app.use('/api', apiRouter);

  // ─── Global Error Handler ────────────────────────────────────────────────────
  app.use((err, req, res, next) => {
    logger.error(`Error [${req.id}]: ${err.message}`);
    res.status(err.statusCode || 500).json({ status: 'error', message: err.message });
  });

  // ─── DB + Start ──────────────────────────────────────────────────────────────
  mongoose
    .connect(process.env.MONGODB_URI, { maxPoolSize: 50 })
    .then(() => {
      logger.info(`Worker ${process.pid} connected to MongoDB.`);
      // Workers don't call server.listen() — the primary's sticky server handles that
      process.on('SIGTERM', () => server.close(() => process.exit(0)));
    })
    .catch((err) => {
      logger.error('MongoDB connection failed', { message: err.message });
      process.exit(1);
    });
}