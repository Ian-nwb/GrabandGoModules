// src/modules/payments/payments.routes.js
const express = require('express');
const router = express.Router();
const paymentsController = require('./payments.controller');

// Optional: Add your auth token middleware here later if users must be logged in to pay!
router.post('/checkout', paymentsController.checkout);

module.exports = router;