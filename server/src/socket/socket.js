require("dotenv").config();

const { Server } = require("socket.io");
const { redisClient } = require("../config/redis");

const Message = require("../models/message.model");
const Chat = require("../models/chat.model");

const FRONT_URL = process.env.FRONT_URL;
const { setIO } = require("./socketInstance");
const { setLastSeen } = require("../services/user.service");

const setupSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: FRONT_URL,
            methods: ["GET", "POST", "DELETE", "PUT"],
        },
    });

    setIO(io);

    const disconnect = async (socket) => {
    try {
        console.log(`Socket disconnected: ${socket.id}`);

        // 1️⃣ Get userId for this socket
        const userId = await redisClient.get(
            `chat:socket_user:${socket.id}`
        );

        if (!userId) return;

        // 2️⃣ Remove this socket from user's socket set
        await redisClient.sRem(
            `chat:user_sockets:${userId}`,
            socket.id
        );

        // 3️⃣ Remove reverse mapping
        await redisClient.del(`chat:socket_user:${socket.id}`);

        // 4️⃣ CLEAN ZOMBIE SOCKETS
        const sockets = await redisClient.sMembers(
            `chat:user_sockets:${userId}`
        );

        let activeSockets = 0;

        for (const sid of sockets) {
            // If Socket.IO no longer has this socket → remove it
            if (io.sockets.sockets.get(sid)) {
                activeSockets++;
            } else {
                await redisClient.sRem(
                    `chat:user_sockets:${userId}`,
                    sid
                );
            }
        }

        // 5️⃣ If NO active sockets → user offline
        if (activeSockets === 0) {
            await redisClient.sRem("chat:online_users", userId);
            await setLastSeen(userId);

            console.log(`User ${userId} went offline`);
        }

        // 6️⃣ ALWAYS emit updated online list
        const onlineUsers = await redisClient.sMembers(
            "chat:online_users"
        );
        io.emit("online-users", onlineUsers);

    } catch (error) {
        console.error("Disconnect error:", error);
    }
};


    /* ===================== SEND MESSAGE ===================== */
    const sendMessage = async ({ sender, receiver, content }) => {
        try {
            if (!sender || !receiver || !content) return;

            /* 1️⃣ FIND OR CREATE CHAT */
            let chat = await Chat.findOne({
                participants: { $all: [sender, receiver] },
            });

            if (!chat) {
                chat = await Chat.create({
                    participants: [sender, receiver],
                });
            }

            /* 2️⃣ CREATE MESSAGE (SENT) */
            let message = await Message.create({
                chat: chat._id,
                sender,
                receiver,
                content,
                status: "sent",
            });

            /* 3️⃣ UPDATE CHAT */
            chat.lastMessage = message._id;
            await chat.save();

            /* 4️⃣ FETCH SOCKETS */
            const senderSockets = await redisClient.sMembers(
                `chat:user_sockets:${sender}`
            );
            const receiverSockets = await redisClient.sMembers(
                `chat:user_sockets:${receiver}`
            );

            /* 5️⃣ DELIVER MESSAGE */
            if (receiverSockets.length > 0) {
                await Message.findByIdAndUpdate(message._id, {
                    status: "delivered",
                });

                message.status = "delivered";

                receiverSockets.forEach((sid) => {
                    io.to(sid).emit("receive-message", message);
                });

                senderSockets.forEach((sid) => {
                    io.to(sid).emit("message:delivered", {
                        messageId: message._id,
                    });
                });
            }

            /* 6️⃣ ALWAYS EMIT TO SENDER */
            senderSockets.forEach((sid) => {
                io.to(sid).emit("receive-message", message);
            });
        } catch (error) {
            console.error("Send message error:", error);
        }
    };

    /* ===================== MESSAGE READ ===================== */
    const markMessageRead = async ({ sender, receiver }) => {
        try {
            if (!sender || !receiver) return;

            /**
             * Mark all delivered messages from sender → receiver as READ
             */
            await Message.updateMany(
                {
                    sender,
                    receiver,
                    status: { $ne: "read" },
                },
                { $set: { status: "read" } }
            );

            /**
             * Notify sender (all sockets)
             */
            const senderSockets = await redisClient.sMembers(
                `chat:user_sockets:${sender}`
            );

            senderSockets.forEach((socketId) => {
                io.to(socketId).emit("message:read", {
                    sender: receiver, // who read the messages
                });
            });
        } catch (error) {
            console.error("Message read error:", error);
        }
    };

    /* ===================== TYPING ===================== */
    const startTyping = async ({ sender, receiver }) => {
        await redisClient.set(
            `chat:typing:${receiver}:${sender}`,
            "1",
            { EX: 2 }
        );

        const receiverSockets = await redisClient.sMembers(
            `chat:user_sockets:${receiver}`
        );

        receiverSockets.forEach((sid) => {
            io.to(sid).emit("typing:start", { sender });
        });
    };

    const stopTyping = async ({ sender, receiver }) => {
        await redisClient.del(`chat:typing:${receiver}:${sender}`);

        const receiverSockets = await redisClient.sMembers(
            `chat:user_sockets:${receiver}`
        );

        receiverSockets.forEach((sid) => {
            io.to(sid).emit("typing:stop", { sender });
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

            // Online tracking
            await redisClient.sAdd("chat:online_users", userId);
            await redisClient.sAdd(`chat:user_sockets:${userId}`, socket.id);
            await redisClient.set(`chat:socket_user:${socket.id}`, userId);

            const onlineUsers = await redisClient.sMembers(
                "chat:online_users"
            );
            io.emit("online-users", onlineUsers);

            socket.on("send-message", sendMessage);
            socket.on("message:read", markMessageRead);
            socket.on("typing:start", startTyping);
            socket.on("typing:stop", stopTyping);
            socket.on("disconnect", () => disconnect(socket));
        } catch (err) {
            console.error("Socket connection error:", err);
        }
    });
};

module.exports = setupSocket;
