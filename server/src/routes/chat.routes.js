const router = require("express").Router();
const { getAllChats, fetchMessagesByChatId, createGroupChat } = require("../controllers/chat.controller");
const { isUserAuthenticated } = require("../validators/authenticate.user");

router.get ("/", isUserAuthenticated, getAllChats);
router.get ("/:chatId/messages", isUserAuthenticated, fetchMessagesByChatId);
router.post("/group", isUserAuthenticated, createGroupChat);

module.exports = router;
