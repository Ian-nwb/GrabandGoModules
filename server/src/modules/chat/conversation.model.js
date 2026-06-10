// src/modules/chat/conversation.model.js
const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema(
  {
    // 'direct' for 1-on-1, 'group' for group chats
    type: {
      type: String,
      enum: ['direct', 'group'],
      default: 'direct',
      required: true
    },
    participants: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true
        },
        nickname: { type: String, default: null },
        role: { type: String, enum: ['admin', 'member'], default: 'member' },
        joinedAt: { type: Date, default: Date.now },
        // Tracks where the user has read up to
        lastReadMessage: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Message',
          default: null
        }
      }
    ],
    // Group chat only
    groupName: { type: String, default: null },
    groupPhoto: { type: String, default: null },
    // Cached reference for quick "last message" preview (like FB Messenger threads)
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null
    },
    theme: { type: String, default: null },   // e.g. hex color or theme name
    emoji: { type: String, default: '👍' },   // quick reaction emoji
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

// Prevent duplicate direct conversations between the same two users
ConversationSchema.index(
  { type: 1, 'participants.user': 1 },
  { unique: false } // enforced at app level for 'direct' type
);

module.exports = mongoose.model('Conversation', ConversationSchema);