const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const socketIo = require('socket.io');

const app = express();
const server = createServer(app);
const io = socketIo(server, { cors: { origin: '*' } }); // Configure CORS for frontend

// Security middleware
app.use(helmet());
app.use(cors());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 })); // Rate limiting

// Body parsing
app.use(express.json());

// Routes (we'll add these later)
app.use('/api/auth', require('./modules/auth/routes'));
app.use('/api/chat', require('./modules/chat/routes'));

module.exports = { app, server, io };