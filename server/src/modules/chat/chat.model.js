// src/modules/chat/chat.model.js
const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    // Can be used for 1-on-1 chat
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    // Can be used for group channels/rooms
    room: {
      type: String,
      index: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    isRead: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Message', MessageSchema);