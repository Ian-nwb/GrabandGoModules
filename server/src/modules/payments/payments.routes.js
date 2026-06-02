// src/modules/payments/payments.routes.js
const express = require('express');
const router = express.Router();
const paymentsController = require('./payments.controller');
const { protect } = require('../../middleware/auth');

// 🔐 Secured Checkout Link Generation
router.post('/checkout', protect, paymentsController.checkout);

// 📡 Open Webhook Event Channel (Server-to-Server Only)
router.post('/webhook', paymentsController.handleWebhook);

module.exports = router;