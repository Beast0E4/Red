import { createSlice } from "@reduxjs/toolkit";
import { io } from "socket.io-client";
import { addChat, setOnlineUsers } from "./chat.slice";

// Use environment variable at the top
const BASE_URL = import.meta.env.VITE_BASE_URL;

let socketInstance = null;

const initialState = {
  socket: null,
  connected: false,
};

const socketSlice = createSlice({
  name: "socket",
  initialState,
  reducers: {
    initSocket: (state, action) => {
      const { userId, dispatch } = action.payload;

      if (!socketInstance) {
        socketInstance = io(BASE_URL, {
          transports: ["websocket"],
          autoConnect: false,
          query: { userId },
        });

        socketInstance.connect();

        // Global listeners
        socketInstance.on("connect", () => {
          console.log("Socket connected");
          dispatch(setConnected(true));
        });

        socketInstance.on("disconnect", () => {
          console.log("Socket disconnected");
          dispatch(setConnected(false));
        });

        socketInstance.on("online-users", (data) => {
          dispatch(setOnlineUsers ({ onlineUsers: data }));
        });

        socketInstance.on("chat:new", (chat) => {
            dispatch (addChat (chat));
        })
      }

      state.socket = socketInstance;
    },

    disconnectSocket: (state) => {
      if (socketInstance) {
        socketInstance.off("connect");
        socketInstance.off("disconnect");
        socketInstance.off("online-users");
        socketInstance.off("chat:new");

        socketInstance.disconnect();
        socketInstance = null;
        state.socket = null;
        state.connected = false;
      }
    },

    setConnected: (state, action) => {
      state.connected = action.payload;
    },
  },
});

export const { initSocket, disconnectSocket, setConnected } = socketSlice.actions;
export default socketSlice.reducer;
