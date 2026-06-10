// src/modules/chat/message.controller.js
const messageService = require('./message.service');

const sendMessage = async (req, res) => {
  try {
    const { type, content, replyTo } = req.body;
    const message = await messageService.sendMessage({
      conversationId: req.params.conversationId,
      senderId: req.user._id,
      type,
      content,
      replyTo
    });
    res.status(201).json({ success: true, data: message });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const getMessages = async (req, res) => {
  try {
    const { page, limit } = req.query;
    const messages = await messageService.getMessages({
      conversationId: req.params.conversationId,
      userId: req.user._id,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 30
    });
    res.json({ success: true, data: messages });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const editMessage = async (req, res) => {
  try {
    const message = await messageService.editMessage({
      messageId: req.params.messageId,
      userId: req.user._id,
      text: req.body.text
    });
    res.json({ success: true, data: message });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const unsendMessage = async (req, res) => {
  try {
    const message = await messageService.unsendMessage({
      messageId: req.params.messageId,
      userId: req.user._id
    });
    res.json({ success: true, data: message });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const reactToMessage = async (req, res) => {
  try {
    const message = await messageService.reactToMessage({
      messageId: req.params.messageId,
      userId: req.user._id,
      emoji: req.body.emoji
    });
    res.json({ success: true, data: message });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const removeReaction = async (req, res) => {
  try {
    const message = await messageService.removeReaction({
      messageId: req.params.messageId,
      userId: req.user._id
    });
    res.json({ success: true, data: message });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const markAsRead = async (req, res) => {
  try {
    await messageService.markAsRead({
      conversationId: req.params.conversationId,
      userId: req.user._id,
      messageId: req.body.messageId
    });
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

module.exports = {
  sendMessage,
  getMessages,
  editMessage,
  unsendMessage,
  reactToMessage,
  removeReaction,
  markAsRead
};