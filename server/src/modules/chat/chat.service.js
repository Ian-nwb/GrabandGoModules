// src/modules/chat/chat.service.js
const Message = require('./chat.model');

/**
 * Commits a chat message permanently to the database
 */
const saveMessage = async (senderId, messageText, roomId, receiverId = null) => {
  return await Message.create({
    sender: senderId,
    message: messageText,
    room: roomId,
    receiver: receiverId
  });
};

/**
 * Fetches the conversation history for a specific room/channel
 */
const getChatHistory = async (roomId, limit = 50) => {
  return await Message.find({ room: roomId })
    .populate('sender', 'email name') // Pull user profile details automatically
    .sort({ createdAt: 1 }) // Chronological order
    .limit(limit);
};

module.exports = {
  saveMessage,
  getChatHistory
};