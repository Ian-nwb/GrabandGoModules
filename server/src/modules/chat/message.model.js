// src/modules/chat/message.model.js
const mongoose = require('mongoose');

const ReactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    emoji: { type: String, required: true }
  },
  { _id: false }
);

const MessageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    // Message types like FB Messenger
    type: {
      type: String,
      enum: ['text', 'image', 'video', 'audio', 'file', 'sticker', 'gif', 'system'],
      default: 'text'
    },
    content: {
      text: { type: String, trim: true, default: null },
      mediaUrl: { type: String, default: null },    // for image/video/audio/file
      fileName: { type: String, default: null },
      fileSize: { type: Number, default: null },    // bytes
      mimeType: { type: String, default: null },
      thumbnailUrl: { type: String, default: null } // for video previews
    },
    // Reply/thread support
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null
    },
    // FB-style emoji reactions (multiple users, multiple emojis)
    reactions: { type: [ReactionSchema], default: [] },
    // Delivery/read receipts
    deliveredTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    readBy: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        readAt: { type: Date, default: Date.now }
      }
    ],
    isEdited: { type: Boolean, default: false },
    editedAt: { type: Date, default: null },
    isUnsent: { type: Boolean, default: false }, // FB "remove for everyone"
    isDeleted: { type: Boolean, default: false }  // soft delete
  },
  { timestamps: true }
);

module.exports = mongoose.model('Message', MessageSchema);