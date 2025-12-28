require("dotenv").config();

const { Server } = require("socket.io");
const { redisClient } = require("../config/redis");

const Message = require("../models/message.model");
const Chat = require("../models/chat.model");

const FRONT_URL = process.env.FRONT_URL;
const { setIO } = require("./socketInstance");
const { setLastSeen } = require("../services/user.service");

const {
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    sendOffer,
    sendAnswer,
    sendIceCandidate,
} = require ('./call.socket');

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
    const sendMessage = async ({ chatId, sender, content, replyTo }) => {
        try {
            if (!chatId || !sender || !content) return;

            /* 1️⃣ FIND CHAT */
            const chat = await Chat.findById(chatId).populate(
                "participants",
                "_id username"
            );

            if (!chat) return;

            /* 2️⃣ DETERMINE RECEIVERS */
            const receivers = chat.participants
                .filter((p) => p._id.toString() !== sender.toString())
                .map((p) => p._id.toString());

            /* 3️⃣ CREATE MESSAGE */
            let message = await Message.create({
                chat: chat._id,
                sender,
                receiver: chat.isGroupChat ? null : receivers[0], // null for groups
                content,
                status: "sent",
                replyTo
            });

            message = await Message.findById(message._id)
                .populate("sender", "_id username")
                .populate({
                    path: "reactions.users",
                    select: "_id username",
                })
                .populate({
                    path: "replyTo",
                    populate: { path: "sender", select: "username" },
                });

            /* 4️⃣ UPDATE UNREAD COUNTS */
            const unreadUpdates = {};
            receivers.forEach((uid) => {
                unreadUpdates[`unreadCount.${uid}`] = 1;
            });

            await Chat.findByIdAndUpdate(chat._id, {
                $inc: unreadUpdates,
                lastMessage: message._id,
            });

            /* 5️⃣ FETCH SOCKETS */
            const senderSockets = await redisClient.sMembers(
                `chat:user_sockets:${sender}`
            );

            let receiverSockets = [];
            for (const uid of receivers) {
                const sockets = await redisClient.sMembers(
                    `chat:user_sockets:${uid}`
                );
                receiverSockets.push(...sockets);
            }

            /* 6️⃣ DELIVER MESSAGE */
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

            /* 7️⃣ ALWAYS EMIT TO SENDER */
            senderSockets.forEach((sid) => {
                io.to(sid).emit("receive-message", message);
            });

        } catch (error) {
            console.error("Send message error:", error);
        }
    };

    /* ===================== MESSAGE READ ===================== */
    const markMessageRead = async ({ chatId, sender }) => {
        try {
            if (!chatId || !sender) return;

            /**
             * 1️⃣ Find chat to get the other participant
             */
            const chat = await Chat.findById(chatId);
            if (!chat) return;

            const receiver = chat.participants.find(
                (id) => id.toString() !== sender.toString()
            );

            if (!receiver) return;

            /**
             * 2️⃣ Mark all messages as READ
             * sender = message sender (other user)
             * receiver = current user (reader)
             */
            await Message.updateMany(
                {
                    chat: chatId,
                    sender: receiver,
                    receiver: sender,
                    status: { $ne: "read" },
                },
                { $set: { status: "read" } }
            );

            /**
             * 3️⃣ Reset unread count for this user
             */
            await Chat.findByIdAndUpdate(chatId, {
                $set: {
                    [`unreadCount.${sender}`]: 0,
                },
            });

            /**
             * 4️⃣ Notify OTHER USER that messages were read
             */
            const receiverSockets = await redisClient.sMembers(
                `chat:user_sockets:${receiver}`
            );

            receiverSockets.forEach((socketId) => {
                io.to(socketId).emit("message:read", {
                    chatId,
                    reader: sender, // who read the messages
                });
            });

        } catch (error) {
            console.error("Message read error:", error);
        }
    };


    /* ===================== TYPING ===================== */
    const startTyping = async ({ sender, chatId }) => {
        try {
            if (!sender || !chatId) return;

            /* 1️⃣ Get chat participants */
            const chat = await Chat.findById(chatId).select("participants isGroupChat");
            if (!chat) return;

            /* 2️⃣ Determine receivers (everyone except sender) */
            const receivers = chat.participants
                .map(String)
                .filter((id) => id !== sender.toString());

            /* 3️⃣ Set typing flag in Redis (auto-expire) */
            for (const receiver of receivers) {
                await redisClient.set(
                    `chat:typing:${chatId}:${receiver}:${sender}`,
                    "1",
                    { EX: 2 }
                );
            }

            /* 4️⃣ Emit typing:start to all receiver sockets */
            for (const receiver of receivers) {
                const sockets = await redisClient.sMembers(
                    `chat:user_sockets:${receiver}`
                );

                sockets.forEach((sid) => {
                    io.to(sid).emit("typing:start", {
                        sender,
                        chatId,
                    });
                });
            }
        } catch (err) {
            console.error("Typing start error:", err);
        }
    };

    const stopTyping = async ({ sender, chatId }) => {
        try {
            if (!sender || !chatId) return;

            /* 1️⃣ Get chat participants */
            const chat = await Chat.findById(chatId).select("participants");
            if (!chat) return;

            /* 2️⃣ Determine receivers */
            const receivers = chat.participants
                .map(String)
                .filter((id) => id !== sender.toString());

            /* 3️⃣ Clear typing flag */
            for (const receiver of receivers) {
                await redisClient.del(
                    `chat:typing:${chatId}:${receiver}:${sender}`
                );
            }

            /* 4️⃣ Emit typing:stop */
            for (const receiver of receivers) {
                const sockets = await redisClient.sMembers(
                    `chat:user_sockets:${receiver}`
                );

                sockets.forEach((sid) => {
                    io.to(sid).emit("typing:stop", {
                        sender,
                        chatId,
                    });
                });
            }
        } catch (err) {
            console.error("Typing stop error:", err);
        }
    };

    const handleMessageReaction = async ({ messageId, emoji, sender, chatId }) => {
        try {
            const message = await Message.findById(messageId);
            if (!message) return;

            const reaction = message.reactions.find(
                (r) => r.emoji === emoji
            );

            if (!reaction) {
                // First reaction for this emoji
                message.reactions.push({
                    emoji,
                    users: [sender],
                });
            } else {
                const userIndex = reaction.users.findIndex(
                    (u) => u.toString() === sender
                );

                if (userIndex > -1) {
                    // Remove reaction
                    reaction.users.splice(userIndex, 1);

                    if (reaction.users.length === 0) {
                        message.reactions = message.reactions.filter(
                            (r) => r.emoji !== emoji
                        );
                    }
                } else {
                    // Add reaction
                    reaction.users.push(sender);
                }
            }

            await message.save();

            const populatedMessage = await Message.findById(message._id)
                .populate("sender", "_id username")
                .populate({
                    path: "reactions.users",
                    select: "_id username",
                });

            const chat = await Chat.findById(chatId).select("participants");
            if (!chat) return;

            for (const userId of chat.participants) {
                const sockets = await redisClient.sMembers(
                    `chat:user_sockets:${userId}`
                );

                sockets.forEach((socketId) => {
                    io.to(socketId).emit(
                        "message:reaction:update",
                        populatedMessage
                    );
                });
            }
        } catch (error) {
            console.error("Reaction error:", error);
        }
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
            socket.on("message:react", handleMessageReaction);

            socket.on("call:start", startCall);
            socket.on("call:accept", acceptCall);
            socket.on("call:reject", rejectCall);
            socket.on("call:end", endCall);

            /* ================= WEBRTC SIGNAL ================= */

            socket.on("webrtc:offer", sendOffer);
            socket.on("webrtc:answer", sendAnswer);
            socket.on("webrtc:ice-candidate", sendIceCandidate);

            socket.on("disconnect", () => disconnect(socket));
        } catch (err) {
            console.error("Socket connection error:", err);
        }
    });
};

module.exports = setupSocket;
