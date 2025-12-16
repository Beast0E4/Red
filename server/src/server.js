const express = require ('express');
const app = express ();

require('dotenv').config();
const { server, io } = require('./app');
const connectDB = require('./config/db');
const { connectRedis } = require('./config/redis');
const http = require("http");
const setupSocket = require("./socket/socket");

const PORT = process.env.PORT || 8080;

app.use(function (req, res, next) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Access-Control-Allow-Headers, Origin, Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers, x-access-token");
    next();
});

// Connect to DB and Redis
connectDB();
connectRedis();

// Initialize Socket.IO
setupSocket (http.createServer(app));

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));