// src/modules/chat/conversation.controller.js
const conversationService = require('./conversation.service');

const createConversation = async (req, res) => {
  try {
    const { type, participantIds, groupName, groupPhoto } = req.body;
    const conversation = await conversationService.createConversation({
      type,
      participantIds: [...participantIds, req.user._id],
      groupName,
      groupPhoto,
      creatorId: req.user._id
    });
    res.status(201).json({ success: true, data: conversation });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const getConversations = async (req, res) => {
  try {
    const conversations = await conversationService.getConversationsByUser(req.user._id);
    res.json({ success: true, data: conversations });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getConversationById = async (req, res) => {
  try {
    const conversation = await conversationService.getConversationById(
      req.params.conversationId,
      req.user._id
    );
    res.json({ success: true, data: conversation });
  } catch (err) {
    res.status(404).json({ success: false, message: err.message });
  }
};

const updateConversation = async (req, res) => {
  try {
    const conversation = await conversationService.updateConversation(
      req.params.conversationId,
      req.user._id,
      req.body
    );
    res.json({ success: true, data: conversation });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const deleteConversation = async (req, res) => {
  try {
    await conversationService.deleteConversation(req.params.conversationId, req.user._id);
    res.json({ success: true, message: 'Conversation deleted' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const addParticipant = async (req, res) => {
  try {
    const conversation = await conversationService.addParticipant(
      req.params.conversationId,
      req.user._id,
      req.body.userId
    );
    res.json({ success: true, data: conversation });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const removeParticipant = async (req, res) => {
  try {
    const conversation = await conversationService.removeParticipant(
      req.params.conversationId,
      req.user._id,
      req.params.userId
    );
    res.json({ success: true, data: conversation });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

module.exports = {
  createConversation,
  getConversations,
  getConversationById,
  updateConversation,
  deleteConversation,
  addParticipant,
  removeParticipant
};