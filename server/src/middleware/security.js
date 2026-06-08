// src/middleware/security.js
const hpp = require('hpp');
const mongoSanitize = require('express-mongo-sanitize');
const { v4: uuidv4 } = require('uuid');

const securityMiddleware = [
  // 1. Request ID Tracing
  (req, res, next) => {
    req.id = req.headers['x-request-id'] || uuidv4();
    res.setHeader('x-request-id', req.id);
    next();
  },
  // 2. Prevent HTTP Parameter Pollution
  hpp(),
  // 3. Prevent NoSQL Injection
  mongoSanitize()
];

module.exports = securityMiddleware;