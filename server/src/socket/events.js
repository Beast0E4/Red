const jwt = require('jsonwebtoken');
const User = require('../modules/auth/models/User');
const Message = require('../modules/message/models/Message');
const { client } = require('../config/redis');

module.exports = (socket, io, redisClient) => {
  // Authenticate socket
  socket.on('authenticate', (token) => {
    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (!err) {
        socket.userId = decoded.id;
        await User.findByIdAndUpdate(decoded.id, { isOnline: true });
        io.emit('user_online', decoded.id);
      }
    });
  });

  // Join chat room
  socket.on('join_chat', (chatId) => {
    socket.join(chatId);
  });

  // Send message
  socket.on('send_message', async (data) => {
    const { chatId, content } = data;
    const message = new Message({ chat: chatId, sender: socket.userId, content });
    await message.save();
    io.to(chatId).emit('receive_message', message);

    // Update unread count in Redis
    const participants = await Chat.findById(chatId).select('participants');
    participants.forEach(async (p) => {
      if (p.toString() !== socket.userId) {
        await redisClient.incr(`unread:${p}:${chatId}`);
      }
    });
  });

  // Typing indicator
  socket.on('typing', (chatId) => {
    socket.to(chatId).emit('user_typing', socket.userId);
  });

  socket.on('stop_typing', (chatId) => {
    socket.to(chatId).emit('user_stop_typing', socket.userId);
  });

  // Disconnect
  socket.on('disconnect', async () => {
    if (socket.userId) {
      await User.findByIdAndUpdate(socket.userId, { isOnline: false });
      io.emit('user_offline', socket.userId);
    }
  });
};