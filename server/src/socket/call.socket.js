const { redisClient } = require("../config/redis");
const { getIO } = require("./socketInstance");

const User = require ('../models/user.model')

const getUsername = async (userId) => {
    try {
        const user = await User.findById(userId).select("username");

        if (!user) {
            console.log("User not found");
            return null;
        }

        console.log("Found username:", user.username);
        return user.username;

    } catch (error) {
        console.error("Error fetching username:", error);
    }
};

const emitToUser = async (userId, event, payload) => {
    const io = getIO();

    const sockets = await redisClient.sMembers(
        `chat:user_sockets:${userId}`
    );

    sockets.forEach((sid) => {
        io.to(sid).emit(event, payload);
    });
};

/* ===================== START CALL ===================== */
const startCall = async ({ callerId, receiverId, callType }) => {
    if (!callerId || !receiverId || !callType) return;

    const username = await getUsername (callerId);

    await emitToUser(receiverId, "call:incoming", {
        from: { _id: callerId, username },
        type: callType,
    });
};

/* ===================== ACCEPT CALL ===================== */
const acceptCall = async ({ callerId, receiverId }) => {
    const username = await getUsername (receiverId);

    await emitToUser(callerId, "call:accepted", {
        by: { _id: receiverId, username },
    });
};

/* ===================== REJECT CALL ===================== */
const rejectCall = async ({ callerId, receiverId }) => {
    const username = await getUsername (receiverId);

    await emitToUser(callerId, "call:rejected", {
        by: { _id: receiverId, username },
    });
};

/* ===================== END CALL ===================== */
const endCall = async ({ callerId, receiverId }) => {
    const receiverUsername = await getUsername (receiverId);

    await emitToUser(callerId, "call:end", {
        by: { _id: receiverId, username : receiverUsername },
    });

    const senderUsername = await getUsername (callerId);

    await emitToUser(receiverId, "call:end", {
        by: { _id: callerId, username : senderUsername },
    });
};

/* ===================== WEBRTC SIGNALING ===================== */

/**
 * OFFER
 */
const sendOffer = async ({ from, to, offer }) => {
    await emitToUser(to, "webrtc:offer", {
        from,
        offer,
    });
};

/**
 * ANSWER
 */
const sendAnswer = async ({ from, to, answer }) => {
    await emitToUser(to, "webrtc:answer", {
        from,
        answer,
    });
};

/**
 * ICE CANDIDATE
 */
const sendIceCandidate = async ({ from, to, candidate }) => {
    await emitToUser(to, "webrtc:ice-candidate", {
        from,
        candidate,
    });
};

module.exports = {
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    sendOffer,
    sendAnswer,
    sendIceCandidate,
};
