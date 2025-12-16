const { client } = require('../config/redis');
const events = require('./events');

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    events(socket, io, client);
  });
};