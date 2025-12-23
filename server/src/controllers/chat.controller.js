const { getUserChats, getMessagesByChatId } = require("../services/chat.service");

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

module.exports = {
    getAllChats, fetchMessagesByChatId
};
