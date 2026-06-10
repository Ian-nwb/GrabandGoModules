// src/modules/chat/chat.socket.js
const messageService = require('./message.service');
const conversationService = require('./conversation.service');

// Map of userId -> Set of socketIds (one user can have multiple tabs open)
const onlineUsers = new Map();

const registerSocket = (userId, socketId) => {
  if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
  onlineUsers.get(userId).add(socketId);
};

const unregisterSocket = (userId, socketId) => {
  const sockets = onlineUsers.get(userId);
  if (sockets) {
    sockets.delete(socketId);
    if (sockets.size === 0) onlineUsers.delete(userId);
  }
};

const isOnline = (userId) => onlineUsers.has(userId.toString());

const emitToUser = (io, userId, event, data) => {
  const sockets = onlineUsers.get(userId.toString());
  if (sockets) sockets.forEach((socketId) => io.to(socketId).emit(event, data));
};

module.exports = (io) => {
  io.use((socket, next) => {
    // Attach authenticated user from handshake auth token
    // Assumes you verify JWT and attach user in middleware
    const user = socket.handshake.auth?.user;
    if (!user) return next(new Error('Unauthorized'));
    socket.user = user;
    next();
  });

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();

    registerSocket(userId, socket.id);
    socket.broadcast.emit('user:online', { userId });

    // Join all personal conversation rooms on connect
    socket.on('conversations:join', async (conversationIds) => {
      conversationIds.forEach((id) => socket.join(`conversation:${id}`));
    });

    // Typing indicators
    socket.on('typing:start', ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit('typing:start', {
        conversationId,
        userId
      });
    });

    socket.on('typing:stop', ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit('typing:stop', {
        conversationId,
        userId
      });
    });

    // Send message via socket (alternative to REST)
    socket.on('message:send', async ({ conversationId, type, content, replyTo }, callback) => {
      try {
        const message = await messageService.sendMessage({
          conversationId,
          senderId: socket.user._id,
          type,
          content,
          replyTo
        });

        // Emit to all participants in the conversation room
        io.to(`conversation:${conversationId}`).emit('message:new', message);

        if (callback) callback({ success: true, data: message });
      } catch (err) {
        if (callback) callback({ success: false, message: err.message });
      }
    });

    // Edit message
    socket.on('message:edit', async ({ messageId, text }, callback) => {
      try {
        const message = await messageService.editMessage({
          messageId,
          userId: socket.user._id,
          text
        });

        io.to(`conversation:${message.conversation}`).emit('message:edited', message);

        if (callback) callback({ success: true, data: message });
      } catch (err) {
        if (callback) callback({ success: false, message: err.message });
      }
    });

    // Unsend message
    socket.on('message:unsend', async ({ messageId }, callback) => {
      try {
        const message = await messageService.unsendMessage({
          messageId,
          userId: socket.user._id
        });

        io.to(`conversation:${message.conversation}`).emit('message:unsent', {
          messageId: message._id,
          conversationId: message.conversation
        });

        if (callback) callback({ success: true });
      } catch (err) {
        if (callback) callback({ success: false, message: err.message });
      }
    });

    // React to message
    socket.on('message:react', async ({ messageId, emoji }, callback) => {
      try {
        const message = await messageService.reactToMessage({
          messageId,
          userId: socket.user._id,
          emoji
        });

        io.to(`conversation:${message.conversation}`).emit('message:reacted', {
          messageId: message._id,
          reactions: message.reactions,
          conversationId: message.conversation
        });

        if (callback) callback({ success: true });
      } catch (err) {
        if (callback) callback({ success: false, message: err.message });
      }
    });

    // Remove reaction
    socket.on('message:unreact', async ({ messageId }, callback) => {
      try {
        const message = await messageService.removeReaction({
          messageId,
          userId: socket.user._id
        });

        io.to(`conversation:${message.conversation}`).emit('message:reacted', {
          messageId: message._id,
          reactions: message.reactions,
          conversationId: message.conversation
        });

        if (callback) callback({ success: true });
      } catch (err) {
        if (callback) callback({ success: false, message: err.message });
      }
    });

    // Mark messages as read
    socket.on('messages:read', async ({ conversationId, messageId }, callback) => {
      try {
        await messageService.markAsRead({
          conversationId,
          userId: socket.user._id,
          messageId
        });

        // Notify other participants that this user has read up to messageId
        socket.to(`conversation:${conversationId}`).emit('messages:read', {
          conversationId,
          userId,
          messageId
        });

        if (callback) callback({ success: true });
      } catch (err) {
        if (callback) callback({ success: false, message: err.message });
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      unregisterSocket(userId, socket.id);
      if (!isOnline(userId)) {
        socket.broadcast.emit('user:offline', { userId, lastSeen: new Date() });
      }
    });
  });
};