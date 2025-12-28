const { redisClient } = require("../config/redis");
const { getIO } = require("./socketInstance");
const User = require ('../models/user.model')

/**
 * Helper: emit event to ALL sockets of a user
 */
const emitToUser = async (userId, event, payload) => {
    const io = getIO();

    console.log (event);

    const sockets = await redisClient.sMembers(
        `chat:user_sockets:${userId}`
    );

    sockets.forEach((sid) => {
        io.to(sid).emit(event, payload);
    });
};

/* ===================== START CALL ===================== */
const startCall = async ({ callerId, receiverId, callType }) => {
    /**
     * callType: "audio" | "video"
     */

    if (!callerId || !receiverId || !callType) return;

    const user = await User.findById (callerId);

    await emitToUser(receiverId, "call:incoming", {
        from: user,
        type: callType,
    });
};

/* ===================== ACCEPT CALL ===================== */
const acceptCall = async ({ callerId, receiverId }) => {
    await emitToUser(callerId, "call:accepted", {
        by: receiverId,
    });
};

/* ===================== REJECT CALL ===================== */
const rejectCall = async ({ callerId, receiverId }) => {
    await emitToUser(callerId, "call:rejected", {
        by: receiverId,
    });
};

/* ===================== END CALL ===================== */
const endCall = async ({ callerId, receiverId }) => {
    await emitToUser(callerId, "call:end", {
        by: receiverId,
    });

    await emitToUser(receiverId, "call:end", {
        by: callerId,
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
