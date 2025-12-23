import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../config/axios";

/* ============================================================
   THUNKS
============================================================ */

/* ---------- Fetch all chats ---------- */
export const fetchAllChats = createAsyncThunk(
    "chat/fetchAllChats",
    async (_, { rejectWithValue }) => {
        try {
            const res = await axiosInstance.get(`/chat`, {
                headers: {
                    'x-access-token': localStorage.getItem('token')
                }
            });
            return res.data.chats;
        } catch (err) {
            return rejectWithValue(err.response?.data || err.message);
        }
    }
);

/* ---------- Fetch messages by chatId ---------- */
export const fetchMessagesByChatId = createAsyncThunk(
    "chat/fetchMessagesByChatId",
    async (chatId, { rejectWithValue }) => {
        try {
            const res = await axiosInstance.get(`/chat/${chatId}/messages`, {
                headers: {
                    'x-access-token': localStorage.getItem('token')
                }
            });
            return res.data;
        } catch (err) {
            console.log (err.response);
            return rejectWithValue(err.response?.data || err.message);
        }
    }
);

/* ============================================================
   SLICE
============================================================ */

const chatSlice = createSlice({
    name: "chat",
    initialState: {
        chats: [],            // chat list
        messages: [],         // active chat messages
        onlineUsers: [],      // from socket
        loading: false,
        error: null,
    },

    reducers: {
        /* ---------- Socket online users ---------- */
        setOnlineUsers(state, action) {
            state.onlineUsers = action.payload.onlineUsers;
        },

        /* ---------- Increment unread count ---------- */
        incrementUnread(state, action) {
            const chatId = action.payload;

            const chat = state.chats.find(
                (c) => c._id === chatId
            );

            if (chat) {
                chat.unreadCount = (chat.unreadCount || 0) + 1;
            }
        },

        /* ---------- Clear unread count ---------- */
        clearUnread(state, action) {
            const chatId = action.payload;

            const chat = state.chats.find(
                (c) => c._id === chatId
            );

            if (chat) {
                chat.unreadCount = 0;
            }
        },

        /* ---------- Update last message ---------- */
        updateLastMessage(state, action) {
            const message = action.payload;

            const chat = state.chats.find(
                (c) => c._id === message.chat
            );

            if (chat) {
                chat.lastMessage = message;
            }
        },
    },

    extraReducers: (builder) => {
        builder

            /* ---------- Fetch Chats ---------- */
            .addCase(fetchAllChats.fulfilled, (state, action) => {
                state.loading = false;
                state.chats = action.payload;
            })

            /* ---------- Fetch Messages ---------- */
            .addCase(fetchMessagesByChatId.fulfilled, (state, action) => {
                state.loading = false;
                state.messages = action.payload;
            })
    },
});

export const {
    setOnlineUsers,
    incrementUnread,
    clearUnread,
    updateLastMessage,
} = chatSlice.actions;

export default chatSlice.reducer;
