const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');

const app = express();
const server = createServer(app);

// const chatRoutes = require ('./routes/chat.routes')
const authRoutes = require ('./routes/auth.routes')
const messageRoutes = require ('./routes/message.routes')

// Security middleware
app.use(helmet());
app.use(cors());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 })); // Rate limiting

// Body parsing
app.use(express.json());

// Routes (we'll add these later)
app.use('/auth', authRoutes);
app.use('/messages', messageRoutes);
// app.use('/api/chat', chatRoutes);

module.exports = { app, server };