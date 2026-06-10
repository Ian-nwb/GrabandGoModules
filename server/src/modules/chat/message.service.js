// src/modules/chat/message.service.js
const Message = require('./message.model');
const Conversation = require('./conversation.model');

const sendMessage = async ({ conversationId, senderId, type = 'text', content, replyTo }) => {
  const conversation = await Conversation.findOne({
    _id: conversationId,
    'participants.user': senderId,
    isActive: true
  });

  if (!conversation) throw new Error('Conversation not found or access denied');

  const message = await Message.create({
    conversation: conversationId,
    sender: senderId,
    type,
    content,
    replyTo: replyTo || null
  });

  // Cache last message on conversation for thread preview
  conversation.lastMessage = message._id;
  await conversation.save();

  return message.populate('sender', 'name avatar');
};

const getMessages = async ({ conversationId, userId, page = 1, limit = 30 }) => {
  const conversation = await Conversation.findOne({
    _id: conversationId,
    'participants.user': userId
  });

  if (!conversation) throw new Error('Conversation not found or access denied');

  const messages = await Message.find({
    conversation: conversationId,
    isDeleted: false
  })
    .populate('sender', 'name avatar')
    .populate('replyTo')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  return messages.reverse();
};

const editMessage = async ({ messageId, userId, text }) => {
  const message = await Message.findOne({
    _id: messageId,
    sender: userId,
    isUnsent: false,
    isDeleted: false
  });

  if (!message) throw new Error('Message not found or not authorized');
  if (message.type !== 'text') throw new Error('Only text messages can be edited');

  message.content.text = text;
  message.isEdited = true;
  message.editedAt = new Date();
  return message.save();
};

const unsendMessage = async ({ messageId, userId }) => {
  const message = await Message.findOne({ _id: messageId, sender: userId });

  if (!message) throw new Error('Message not found or not authorized');

  message.isUnsent = true;
  message.content = { text: null, mediaUrl: null, fileName: null, fileSize: null, mimeType: null, thumbnailUrl: null };
  return message.save();
};

const reactToMessage = async ({ messageId, userId, emoji }) => {
  const message = await Message.findOne({ _id: messageId, isDeleted: false, isUnsent: false });

  if (!message) throw new Error('Message not found');

  // Remove existing reaction from this user, then add new one
  message.reactions = message.reactions.filter((r) => r.user.toString() !== userId.toString());
  message.reactions.push({ user: userId, emoji });

  return message.save();
};

const removeReaction = async ({ messageId, userId }) => {
  const message = await Message.findOne({ _id: messageId });

  if (!message) throw new Error('Message not found');

  message.reactions = message.reactions.filter((r) => r.user.toString() !== userId.toString());
  return message.save();
};

const markAsRead = async ({ conversationId, userId, messageId }) => {
  // Update read pointer on conversation participant
  await Conversation.updateOne(
    { _id: conversationId, 'participants.user': userId },
    { $set: { 'participants.$.lastReadMessage': messageId } }
  );

  // Add userId to readBy on all unread messages up to messageId
  const targetMessage = await Message.findById(messageId);
  if (!targetMessage) return;

  await Message.updateMany(
    {
      conversation: conversationId,
      createdAt: { $lte: targetMessage.createdAt },
      'readBy.user': { $ne: userId },
      isDeleted: false
    },
    { $push: { readBy: { user: userId, readAt: new Date() } } }
  );
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