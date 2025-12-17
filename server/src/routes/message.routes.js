const express = require('express');
const { getMessagesByUserId } = require ('../controllers/message.controller')
const { isUserAuthenticated } = require ('../validators/authenticate.user')

const router = express.Router();

router.get("/:userId", isUserAuthenticated, getMessagesByUserId);

module.exports = router;
