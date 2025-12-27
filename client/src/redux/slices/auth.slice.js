import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../config/axios";

const initialState = {
    data: JSON.parse(localStorage.getItem("data")) || undefined,
    token: localStorage.getItem("token") || "",
    isLoggedIn: localStorage.getItem("isLoggedIn") === "true",
    users: []
};

/* ---------- SIGNUP ---------- */
export const signupUser = createAsyncThunk(
  "auth/signup",
  async (data, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post("/auth/register", data);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error);
    }
  }
);

/* ---------- LOGIN ---------- */
export const loginUser = createAsyncThunk(
  "auth/login",
  async (data, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post("/auth/login", data);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error);
    }
  }
);

export const fetchAllUsers = createAsyncThunk(
  "users/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get("/auth");
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,

  reducers: {
    logout: (state) => {
            localStorage.clear();
            state.data = "";
            state.isLoggedIn = false;
            state.token = "";
        },
  },

  extraReducers: (builder) => {
    builder
      .addCase(loginUser.fulfilled, (state, action) => {
        if (!action.payload) return;

        localStorage.setItem("token", action.payload?.token);
        localStorage.setItem("data", JSON.stringify(action.payload?.userdata));
        localStorage.setItem("isLoggedIn", (action.payload?.token != undefined));

        state.data = action.payload.userdata;
        state.token = action.payload.token;
        state.isLoggedIn = (action.payload?.token != undefined);
      })
      .addCase (fetchAllUsers.fulfilled, (state, action) => {
        if (!action.payload) return;

        state.users = action.payload.users;
      })
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
