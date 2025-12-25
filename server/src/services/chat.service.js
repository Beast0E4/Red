const Chat = require("../models/chat.model");
const Message = require ("../models/message.model")

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
        .populate("sender", "username")
        .populate("receiver", "username");

    return messages;
};

module.exports = {
    getUserChats, getMessagesByChatId
};
