const { getUserChats, getMessagesByChatId, createGroupChatService } = require("../services/chat.service");

const getAllChats = async (req, res) => {
    try {
        const userId = req.user.id;

        const chats = await getUserChats(userId);

        res.status(200).json({
            success: true,
            chats,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false });
    }
};

const fetchMessagesByChatId = async (req, res) => {
    try {
        const { chatId } = req.params;
        const userId = req.user.id;

        if (!chatId) {
            return res.status(400).json({
                message: "Chat ID is required",
            });
        }

        const messages = await getMessagesByChatId(chatId, userId);

        return res.status(200).json(messages);
    } catch (error) {
        console.error("Fetch messages error:", error);
        return res.status(500).json({
            message: "Failed to fetch messages",
        });
    }
};

const createGroupChat = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, users } = req.body;

        if (!name || !users || users.length < 2) {
            return res.status(400).json({
                success: false,
                message: "Group name and at least 2 users required",
            });
        }

        const chat = await createGroupChatService ({
            creatorId: userId,
            name,
            users,
        });

        res.status(201).json({
            success: true,
            chat,
        });
    } catch (error) {
        console.error("Create group error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to create group",
        });
    }
};

module.exports = {
    getAllChats, fetchMessagesByChatId, createGroupChat
};
