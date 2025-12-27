// const {
//   getMessagesByUserIdService,
// } = require("../services/message.service");

// const getMessagesByUserId = async (req, res) => {
//   try {
//     const loggedInUserId = req.user.id;
//     const otherUserId = req.params.userId;

//     const messages = await getMessagesByUserIdService(
//       loggedInUserId,
//       otherUserId
//     );

//     res.status(200).json({
//       success: true,
//       messages,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to fetch messages",
//     });
//   }
// };

// module.exports = {
//   getMessagesByUserId,
// };
