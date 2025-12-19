require("dotenv").config();

const { Server } = require("socket.io");
const { redisClient } = require("../config/redis");

const Message = require("../models/message.model");
const Chat = require("../models/chat.model");

const FRONT_URL = process.env.FRONT_URL;
const { setIO } = require("./socketInstance");

const setupSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: FRONT_URL,
            methods: ["GET", "POST", "DELETE", "PUT"],
        },
    });

    setIO(io);

    /* ===================== DISCONNECT ===================== */
    const disconnect = async (socket) => {
        try {
            console.log(`Socket disconnected: ${socket.id}`);

            const userId = await redisClient.get(`chat:socket_user:${socket.id}`);
            if (!userId) return;

            // Remove this socket from user's socket set
            await redisClient.sRem(`chat:user_sockets:${userId}`, socket.id);
            await redisClient.del(`chat:socket_user:${socket.id}`);

            // If user has NO sockets left → mark offline
            const remaining = await redisClient.sCard(`chat:user_sockets:${userId}`);
            if (remaining === 0) {
                await redisClient.sRem("chat:online_users", userId);
            }

            const onlineUsers = await redisClient.sMembers("chat:online_users");
            io.emit("online-users", onlineUsers);
        } catch (err) {
            console.error("Disconnect error:", err);
        }
    };

    /* ===================== SEND MESSAGE ===================== */
    const sendMessage = async (data) => {
        try {
            const { sender, receiver, content } = data;
            if (!sender || !receiver || !content) return;

            /* 1️⃣ Find or create chat */
            let chat = await Chat.findOne({
                participants: { $all: [sender, receiver] },
            });

            if (!chat) {
                chat = await Chat.create({
                    participants: [sender, receiver],
                });
            }

            /* 2️⃣ Create message */
            const message = await Message.create({
                chat: chat._id,
                sender,
                receiver,
                content,
            });

            /* 3️⃣ Update chat */
            chat.lastMessage = message._id;
            await chat.save();

            /* 4️⃣ Emit message to ALL sockets */
            const receiverSockets = await redisClient.sMembers(
                `chat:user_sockets:${receiver}`
            );
            const senderSockets = await redisClient.sMembers(
                `chat:user_sockets:${sender}`
            );

            [...receiverSockets, ...senderSockets].forEach((socketId) => {
                io.to(socketId).emit("receive-message", message);
            });
        } catch (err) {
            console.error("Send message error:", err);
        }
    };

    /* ===================== TYPING ===================== */
    const startTyping = async ({ sender, receiver }) => {
        // auto-expire in case stop event never fires
        await redisClient.set(
            `chat:typing:${receiver}:${sender}`,
            "1",
            { EX: 2 }
        );

        const receiverSockets = await redisClient.sMembers(
            `chat:user_sockets:${receiver}`
        );

        receiverSockets.forEach((socketId) => {
            io.to(socketId).emit("typing:start", { sender });
        });
    };

    const stopTyping = async ({ sender, receiver }) => {
        await redisClient.del(`chat:typing:${receiver}:${sender}`);

        const receiverSockets = await redisClient.sMembers(
            `chat:user_sockets:${receiver}`
        );

        receiverSockets.forEach((socketId) => {
            io.to(socketId).emit("typing:stop", { sender });
        });
    };

    /* ===================== CONNECTION ===================== */
    io.on("connection", async (socket) => {
        try {
            const userId = socket.handshake.query.userId;
            if (!userId) {
                socket.disconnect();
                return;
            }

            console.log(`Socket connected: ${socket.id} (user ${userId})`);

            // Track online user
            await redisClient.sAdd("chat:online_users", userId);

            // Track socket <-> user mapping (MULTI TAB SAFE)
            await redisClient.sAdd(`chat:user_sockets:${userId}`, socket.id);
            await redisClient.set(`chat:socket_user:${socket.id}`, userId);

            const onlineUsers = await redisClient.sMembers("chat:online_users");
            io.emit("online-users", onlineUsers);

            socket.on("send-message", sendMessage);
            socket.on("typing:start", startTyping);
            socket.on("typing:stop", stopTyping);
            socket.on("disconnect", () => disconnect(socket));
        } catch (err) {
            console.error("Socket connection error:", err);
        }
    });
};

module.exports = setupSocket;
