const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const socketIo = require('socket.io');

const app = express();
const server = createServer(app);
const io = socketIo(server, { cors: { origin: '*' } }); // Configure CORS for frontend

const chatRoutes = require ('./routes/chat.routes')
const authRoutes = require ('./routes/auth.routes')

// Security middleware
app.use(helmet());
app.use(cors());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 })); // Rate limiting

// Body parsing
app.use(express.json());

// Routes (we'll add these later)
app.use('/auth', authRoutes);
// app.use('/api/chat', chatRoutes);

module.exports = { app, server, io };