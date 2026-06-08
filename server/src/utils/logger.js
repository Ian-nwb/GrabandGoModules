const winston = require('winston');
require('winston-daily-rotate-file');
const path = require('path');

const transport = new winston.transports.DailyRotateFile({
  filename: path.join(__dirname, '../storage/app-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true, // Compress old logs
  maxSize: '20m',      // Rotate if file hits 20MB
  maxFiles: '14d'      // Keep logs for 14 days
});

const logger = winston.createLogger({
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [
    new winston.transports.Console(),
    transport
  ]
});

module.exports = logger;