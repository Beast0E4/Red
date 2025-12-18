require('dotenv').config();

const { Server } = require("socket.io");
const User = require("../models/user.model");
const Message = require ('../models/message.model')
const Chat = require ('../models/chat.model')
const mongoose = require("mongoose");

const FRONT_URL = process.env.FRONT_URL;

const { setIO, userSocketMap, onlineUsers } = require("./socketInstance"); // To set io globally

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

    const sendMessage = async (data) => {
        try {
            const { sender, receiver, content } = data;

            if (!sender || !receiver || !content) return;

            /* ---------- 1️⃣ FIND OR CREATE CHAT ---------- */
            let chat = await Chat.findOne({
                participants: { $all: [sender, receiver] },
            });

            if (!chat) {
                chat = await Chat.create({
                    participants: [sender, receiver],
                });
            }

            /* ---------- 2️⃣ CREATE MESSAGE ---------- */
            const message = await Message.create({
                chat: chat._id,
                sender,
                receiver,
                content,
            });

            /* ---------- 3️⃣ UPDATE CHAT METADATA ---------- */
            chat.lastMessage = message._id;
            await chat.save();

            /* ---------- 4️⃣ EMIT MESSAGE ---------- */
            const receiverSocketId = userSocketMap.get(receiver.toString());
            const senderSocketId = userSocketMap.get(sender.toString());

            if (receiverSocketId) {
                io.to(receiverSocketId).emit("receive-message", message);
            }

            if (senderSocketId) {
                io.to(senderSocketId).emit("receive-message", message);
            }
        } catch (error) {
            console.error("Send message error:", error);
        }
    };

    const startTyping = ({ sender, receiver, chatId }) => {
        const receiverSocketId = userSocketMap.get(receiver.toString());
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("typing:start", {
                sender,
                chatId,
            });
        }
    };

    const endTyping = ({ sender, receiver, chatId }) => {
        console.log ("check");
        const receiverSocketId = userSocketMap.get(receiver.toString());
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("typing:stop", {
                sender,
                chatId,
            });
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

        onlineUsers.set(socket.id, userId);
        io.emit('online-users', Array.from(onlineUsers.values()));
        
        socket.on("disconnect", () => disconnect(socket));

        socket.on("send-message", sendMessage);
        socket.on ("typing:start", startTyping);
        socket.on ("typing:stop", endTyping);
    });
}

module.exports = setupSocket;
