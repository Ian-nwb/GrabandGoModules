const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const protect = require('./auth.middleware');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected route (Requires Header: Authorization -> Bearer <token>)
router.post('/change-password', protect, authController.changePassword);

module.exports = router;