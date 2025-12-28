import { createSlice } from "@reduxjs/toolkit";

const callSlice = createSlice({
  name: "call",
  initialState: {
    status: "idle", // idle | ringing | ongoing
    incoming: null,
    outgoing: null,
  },
  reducers: {
    incomingCall(state, action) {
      state.incoming = action.payload;
      state.status = "ringing";
    },
    startCall(state, action) {
      state.outgoing = action.payload;
      state.status = "ongoing";
    },
    endCall(state) {
      state.status = "idle";
      state.incoming = null;
      state.outgoing = null;
    },
  },
});

export const { incomingCall, startCall, endCall } = callSlice.actions;
export default callSlice.reducer;
