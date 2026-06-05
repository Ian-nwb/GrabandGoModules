// src/modules/chat/chat.socket.js
const chatService = require('./chat.service');
const jwt = require('jsonwebtoken');

const initChatSocket = (io) => {
  
  //  Socket Authentication Middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers['authorization'];
    
    if (!token) {
      return next(new Error('Authentication error: Token missing'));
    }

    try {
      // Strip 'Bearer ' if present in the socket handshake
      const actualToken = token.startsWith('Bearer ') ? token.split(' ')[1] : token;
      const decoded = jwt.verify(actualToken, process.env.JWT_SECRET);
      socket.user = decoded; // Bind authenticated user payload directly to socket instance
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid Token'));
    }
  });

  //  Connection Established
  io.on('connection', (socket) => {
    console.log(` Live WebSocket connected: User ${socket.user.id}`);

    // User joins a specific conversation channel
    socket.on('join_room', (roomId) => {
      socket.join(roomId);
      console.log(` User ${socket.user.id} entered chatroom: ${roomId}`);
    });

    // Listens for a new live chat transmission
    socket.on('send_message', async (data) => {
      const { roomId, message } = data;

      try {
        // 1. Commit to database asynchronously 
        const freshMessage = await chatService.saveMessage(socket.user.id, message, roomId);
        
        // 2. Broadcast the live event immediately to all active listeners inside that room
        io.to(roomId).emit('receive_message', {
          _id: freshMessage._id,
          sender: { _id: socket.user.id, email: socket.user.email },
          message: freshMessage.message,
          room: freshMessage.room,
          createdAt: freshMessage.createdAt
        });
      } catch (err) {
        socket.emit('error', { msg: 'Failed to deliver message securely' });
      }
    });

    // Cleanup when a browser tab closes
    socket.on('disconnect', () => {
      console.log(` WebSocket disconnected: User ${socket.user.id}`);
    });
  });
};

module.exports = initChatSocket;