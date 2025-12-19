import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosInstance from "../../config/axios";

export const fetchMessagesByUserId = createAsyncThunk(
  "messages/fetchByUserId",
  async (userId, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(`/messages/${userId}`, {
        headers: {
            'x-access-token': localStorage.getItem('token')
        }
      });
      return res.data.messages;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch messages"
      );
    }
  }
);

const messageSlice = createSlice({
  name: "messages",
  initialState: {
    list: [],
    onlineUsers: []
  },
  reducers: {
    clearMessages: (state) => {
      state.list = [];
    },
    setOnlineUsers: (state, action) => {
      const users = action.payload?.onlineUsers;
      state.onlineUsers = users;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMessagesByUserId.fulfilled, (state, action) => {
        state.list = action.payload;
      })
  },
});

export const { clearMessages, setOnlineUsers } = messageSlice.actions;
export default messageSlice.reducer;
