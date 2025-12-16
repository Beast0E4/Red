require('dotenv').config();

const { Server } = require("socket.io");
const User = require("../models/user.model");
const mongoose = require("mongoose");

const FRONT_URL = process.env.FRONT_URL;

const { setIO, userSocketMap } = require("./socketInstance"); // To set io globally

const setupSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: FRONT_URL,
      methods: ["GET", "POST", "DELETE", "PUT"],
    },
  });

  setIO(io); // Make io globally accessible

  // Handle disconnection
  const disconnect = (socket) => {
    console.log(`Client disconnected: ${socket.id}`);
    for (const [userId, socketId] of userSocketMap.entries()) {
      if (socketId === socket.id) {
        userSocketMap.delete(userId);
        break;
      }
    }
    onlineUsers.delete(socket.id);
    io.emit("online-users", Array.from(onlineUsers.values()));
  };

  const sendMessage = async (message) => {
    const senderSocketId = userSocketMap.get(message.sender);
    const recipientSocketId = userSocketMap.get(message.recipient);
    
    const uploadedFiles = [];

  
    // Upload files to Cloudinary
    for (const file of message?.files) {
      try {
        const uploadRes = await uploadFile(file);
        uploadedFiles.push({
          name: file.name,
          url: uploadRes.secure_url,
          filename: file.type,
        });
      } catch (err) {
        console.error("Cloudinary upload error:", err);
      }
    }
  
    // 1. Get the latest personal message between sender and recipient, excluding group messages
    const latestMessage = await Message.findOne({
      $or: [
        { sender: message.sender, recipient: message.recipient, groupId : ""},
        { sender: message.recipient, recipient: message.sender, groupId : ""}
      ]
    }).sort({ createdAt: -1 });
  
    // 2. Check if date separator is needed (before creating the main message)
    const nowDate = new Date().toISOString().slice(0, 10);
    const latestDate = latestMessage?.createdAt?.toISOString().slice(0, 10);
  
    // Check if date separator is required
    if (!latestMessage || nowDate !== latestDate) {
      const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ];
  
      const now = new Date();
      const formattedDate = `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
  
      // Create date message (only if it hasn't been created for today)
      const dateMessage = await Message.create({
        sender: message.sender,
        recipient: message.recipient,
        content: formattedDate,
        files: [],
        targetType: "message",
        messageType: true
      });
  
      // Send date message to both sender and recipient
      if (recipientSocketId) {
        io.to(recipientSocketId).emit("receiveMessage", dateMessage);
      }
      if (senderSocketId) {
        io.to(senderSocketId).emit("receiveMessage", dateMessage);
      }
    }

    if (message.targetType !== "message") {
        const parts = message.content.filename?.split('.') || message.content.image[0]?.filename?.split('.') || message.content.video[0]?.filename?.split('.');
        const extension = parts.pop();
        const base = parts.join('.');

        const url = typeof message.content.video === 'string'
        ? message.content.video
        : message.content.image?.[0]?.url || message.content.video?.[0]?.url;

        if (url) {
            uploadedFiles.push({
                name: message.content.caption || "File",
                url: url,
                filename: `${base}/${extension}`,
            });
        }

        message.content = "";
    }
  
    // 3. Create the actual message
    const createdMessage = await Message.create({
        sender: message.sender,
        recipient: message.recipient,
        targetType: message.targetType,
        postId: message.postId,
        content: message.content,
        messageType: false,
        files: uploadedFiles
    });
  
    const messageData = await Message.findById(createdMessage._id)
      .populate("sender", "id name image")
      .populate("recipient", "id name image");
  
    // Send the actual message to both sender and recipient
    if (recipientSocketId) {
      io.to(recipientSocketId).emit("receiveMessage", messageData);
    }
    if (senderSocketId) {
      io.to(senderSocketId).emit("receiveMessage", messageData);
    }
  };

    io.on("connection", (socket) => {
        console.log(`Socket ${socket.id} connected.`);
        const userId = socket.handshake.query.userId;

        if (userId) {
            userSocketMap.set(userId, socket.id);
            console.log(`User connected: ${userId} with socket id: ${socket.id}`);
        } else {
            console.log("User ID not provided during connection.");
        }
        socket.on("disconnect", () => disconnect(socket));

        socket.on("sendMessage", sendMessage);
    });
}

module.exports = setupSocket;
