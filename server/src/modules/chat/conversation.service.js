// src/modules/chat/conversation.service.js
const Conversation = require('./conversation.model');
const Message = require('./message.model');

const createConversation = async ({ type, participantIds, groupName, groupPhoto, creatorId }) => {
  if (type === 'direct') {
    const existing = await Conversation.findOne({
      type: 'direct',
      'participants.user': { $all: participantIds },
      $expr: { $eq: [{ $size: '$participants' }, 2] }
    });
    if (existing) return existing;
  }

  const participants = participantIds.map((id) => ({
    user: id,
    role: id.toString() === creatorId.toString() ? 'admin' : 'member'
  }));

  const conversation = await Conversation.create({
    type,
    participants,
    groupName: type === 'group' ? groupName : null,
    groupPhoto: type === 'group' ? groupPhoto : null
  });

  return conversation.populate('participants.user', 'name avatar');
};

const getConversationsByUser = async (userId) => {
  return Conversation.find({
    'participants.user': userId,
    isActive: true
  })
    .populate('participants.user', 'name avatar')
    .populate('lastMessage')
    .sort({ updatedAt: -1 });
};

const getConversationById = async (conversationId, userId) => {
  const conversation = await Conversation.findOne({
    _id: conversationId,
    'participants.user': userId
  })
    .populate('participants.user', 'name avatar')
    .populate('lastMessage');

  if (!conversation) throw new Error('Conversation not found or access denied');
  return conversation;
};

const updateConversation = async (conversationId, userId, updates) => {
  const conversation = await Conversation.findOne({
    _id: conversationId,
    'participants': { $elemMatch: { user: userId, role: 'admin' } }
  });

  if (!conversation) throw new Error('Not authorized to update this conversation');

  const allowed = ['groupName', 'groupPhoto', 'theme', 'emoji'];
  allowed.forEach((field) => {
    if (updates[field] !== undefined) conversation[field] = updates[field];
  });

  // Allow nickname updates per participant
  if (updates.nickname) {
    const participant = conversation.participants.find(
      (p) => p.user.toString() === updates.nickname.userId
    );
    if (participant) participant.nickname = updates.nickname.value;
  }

  return conversation.save();
};

const addParticipant = async (conversationId, adminId, newUserId) => {
  const conversation = await Conversation.findOne({
    _id: conversationId,
    type: 'group',
    'participants': { $elemMatch: { user: adminId, role: 'admin' } }
  });

  if (!conversation) throw new Error('Not authorized or not a group conversation');

  const alreadyIn = conversation.participants.some(
    (p) => p.user.toString() === newUserId.toString()
  );
  if (alreadyIn) throw new Error('User already in conversation');

  conversation.participants.push({ user: newUserId, role: 'member' });
  return conversation.save();
};

const removeParticipant = async (conversationId, adminId, targetUserId) => {
  const conversation = await Conversation.findOne({
    _id: conversationId,
    type: 'group',
    'participants': { $elemMatch: { user: adminId, role: 'admin' } }
  });

  if (!conversation) throw new Error('Not authorized or not a group conversation');

  conversation.participants = conversation.participants.filter(
    (p) => p.user.toString() !== targetUserId.toString()
  );

  return conversation.save();
};

const deleteConversation = async (conversationId, userId) => {
  const conversation = await Conversation.findOne({
    _id: conversationId,
    'participants.user': userId
  });

  if (!conversation) throw new Error('Conversation not found or access denied');

  conversation.isActive = false;
  return conversation.save();
};

module.exports = {
  createConversation,
  getConversationsByUser,
  getConversationById,
  updateConversation,
  addParticipant,
  removeParticipant,
  deleteConversation
};