require('dotenv').config();
const { server, io } = require('./app');
const connectDB = require('./config/db');
const connectRedis = require('./config/redis');
const socketHandler = require('./socket');

const PORT = process.env.PORT || 5000;

// Connect to DB and Redis
connectDB();
connectRedis();

// Initialize Socket.IO
socketHandler(io);

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));