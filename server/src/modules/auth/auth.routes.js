const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const protect = require('./auth.middleware');
const catchAsync = require('../../utils/catchAsync'); // Import your safety utility

// Public routes
// Wrap each controller function with catchAsync
router.post('/register', catchAsync(authController.register));
router.post('/login', catchAsync(authController.login));

// Protected route
router.post('/change-password', protect, catchAsync(authController.changePassword));

module.exports = router;