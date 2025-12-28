export const callService = {
  startCall: (socket, payload) => {
    socket.emit("call:start", payload);
  },

  acceptCall: (socket, payload) => {
    socket.emit("call:accept", payload);
  },

  rejectCall: (socket, payload) => {
    socket.emit("call:reject", payload);
  },

  endCall: (socket, payload) => {
    socket.emit("call:end", payload);
  },
};
