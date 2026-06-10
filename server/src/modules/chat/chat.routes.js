// src/modules/chat/chat.routes.js
const express = require('express');
const router = express.Router();
const { protect: auth } = require('../../middleware/auth');
const conversationController = require('./conversation.controller');
const messageController = require('./message.controller');

// Conversation routes
router.post('/conversations', auth, conversationController.createConversation);
router.get('/conversations', auth, conversationController.getConversations);
router.get('/conversations/:conversationId', auth, conversationController.getConversationById);
router.patch('/conversations/:conversationId', auth, conversationController.updateConversation);
router.delete('/conversations/:conversationId', auth, conversationController.deleteConversation);
router.post('/conversations/:conversationId/participants', auth, conversationController.addParticipant);
router.delete('/conversations/:conversationId/participants/:userId', auth, conversationController.removeParticipant);

// Message routes
router.post('/conversations/:conversationId/messages', auth, messageController.sendMessage);
router.get('/conversations/:conversationId/messages', auth, messageController.getMessages);
router.patch('/messages/:messageId', auth, messageController.editMessage);
router.delete('/messages/:messageId', auth, messageController.unsendMessage);
router.post('/messages/:messageId/reactions', auth, messageController.reactToMessage);
router.delete('/messages/:messageId/reactions', auth, messageController.removeReaction);
router.post('/conversations/:conversationId/read', auth, messageController.markAsRead);

module.exports = router;