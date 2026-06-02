// src/modules/chat/chat.routes.js
const express = require('express');
const router = express.Router();
const chatController = require('./chat.controller');
const { protect } = require('../../middleware/auth');

// 🔐 Secured REST Route to pull archive logs
router.get('/history/:roomId', protect, chatController.getRoomHistory);

module.exports = router;