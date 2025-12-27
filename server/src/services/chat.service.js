const Chat = require("../models/chat.model");
const Message = require ("../models/message.model")
const { getIO } = require ('../socket/socketInstance')
const { redisClient } = require ('../config/redis')

const getUserChats = async (userId) => {
    const chats = await Chat.find({
        participants: userId,
    })
        .populate("participants", "username lastSeen")
        .populate({
            path: "lastMessage",
            select: "content sender status createdAt",
        })
        .sort({ updatedAt: -1 })
        .lean(); // 👈 IMPORTANT (returns plain JS objects)

    return chats.map((chat) => ({
        ...chat,
        unreadCount: chat.unreadCount?.[userId.toString()] || 0,
    }));
};


const getMessagesByChatId = async (chatId, userId) => {
    // 1️⃣ Validate chat & membership
    const chat = await Chat.findById(chatId);

    if (!chat) {
        throw new Error("Chat not found");
    }

    const isParticipant = chat.participants
        .map((id) => id.toString())
        .includes(userId.toString());

    if (!isParticipant) {
        throw new Error("Unauthorized ac3cess to chat");
    }

    // 2️⃣ Fetch messages
    const messages = await Message.find({ chat: chatId })
        .sort({ createdAt: 1 }) // oldest → newest
        .populate("sender", "_id username")
        .populate({
            path: "reactions.users",
            select: "_id username",
        });

    return messages;
};

const createGroupChatService = async ({ creatorId, name, users }) => {
    // 1️⃣ Ensure unique participants (string-safe)
    const participants = [
        ...new Set([creatorId.toString(), ...users.map(String)]),
    ];

    // 2️⃣ Initialize unread count
    const unreadCount = {};
    participants.forEach((id) => {
        unreadCount[id] = 0;
    });

    // 3️⃣ Create chat
    let chat = await Chat.create({
        chatName: name,
        isGroupChat: true,
        participants,
        unreadCount,
        groupAdmin: creatorId,
    });

    // 4️⃣ Populate BEFORE emitting
    chat = await chat.populate("participants", "username lastSeen");

    const io = getIO();

    // 5️⃣ Emit to ALL SOCKETS of each participant
    for (const userId of participants) {
        const socketIds = await redisClient.sMembers(
            `chat:user_sockets:${userId}`
        );

        socketIds.forEach((socketId) => {
            io.to(socketId).emit("chat:new", chat);
        });
    }

    return chat;
};


module.exports = {
    getUserChats, getMessagesByChatId, createGroupChatService
};
