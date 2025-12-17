const Message = require("../models/message.model");

const getMessagesByUserIdService = async (userA, userB) => {
  const messages = await Message.find({
    $or: [
      { sender: userA, receiver: userB },
      { sender: userB, receiver: userA },
    ],
  })
    .sort({ createdAt: 1 })
    .lean();

    console.log ("Check -------------->", messages);

  return messages;
};

module.exports = {
  getMessagesByUserIdService,
};
