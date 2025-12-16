// const express = require('express');
// const auth = require('../auth/middleware');
// const Chat = require('./models/Chat');
// const Message = require('../message/models/Message');

// const router = express.Router();

// // Create or get chat
// router.post('/', auth, async (req, res) => {
//   const { participantId } = req.body;
//   let chat = await Chat.findOne({ participants: { $all: [req.user.id, participantId] } });
//   if (!chat) chat = new Chat({ participants: [req.user.id, participantId] });
//   await chat.save();
//   res.json(chat);
// });

// // Get messages for a chat
// router.get('/:chatId/messages', auth, async (req, res) => {
//   const messages = await Message.find({ chat: req.params.chatId }).populate('sender');
//   res.json(messages);
// });

// module.exports = router;