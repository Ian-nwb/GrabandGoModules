// src/modules/chat/chat.controller.js
const chatService = require('./chat.service');

const getRoomHistory = async (req, res) => {
  try {
    const { roomId } = req.params;
    
    if (!roomId) {
      return res.status(400).json({ error: 'Room ID parameter is required' });
    }

    const history = await chatService.getChatHistory(roomId);
    res.status(200).json({ success: true, data: history });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  getRoomHistory
};