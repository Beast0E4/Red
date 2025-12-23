const router = require("express").Router();
const { getAllChats, fetchMessagesByChatId } = require("../controllers/chat.controller");
const { isUserAuthenticated } = require("../validators/authenticate.user");

router.get ("/", isUserAuthenticated, getAllChats);
router.get ("/:chatId/messages", isUserAuthenticated, fetchMessagesByChatId);

module.exports = router;
