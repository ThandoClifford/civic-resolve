const jwt = require('jsonwebtoken');
const User = require('../models/User');

let io = null;

const initializeSocket = (server) => {
  const allowedOrigins = [
    process.env.FRONTEND_URL,
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000'
  ].filter(Boolean);

  io = require('socket.io')(server, {
    cors: {
      origin: allowedOrigins,
      credentials: true
    }
  });

  io.on('connection', async (socket) => {
    const token = socket.handshake.auth?.token;

    if (!token) {
      socket.disconnect(true);
      return;
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
      const user = await User.findById(decoded.id).select('-passwordHash');

      if (!user || !user.active || user.role === 'CITIZEN') {
        socket.disconnect(true);
        return;
      }

      socket.user = user;
      socket.join(`role:${user.role}`);
      console.log(`[Socket] Official connected: ${user.email}`);
    } catch (error) {
      socket.disconnect(true);
    }
  });

  io.on('disconnect', (socket) => {
    console.log(`[Socket] Disconnected: ${socket.id}`);
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized. Call initializeSocket first.');
  }
  return io;
};

module.exports = {
  initializeSocket,
  getIO
};
