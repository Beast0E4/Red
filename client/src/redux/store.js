import { configureStore } from "@reduxjs/toolkit";
import socketSliceReducer from "../redux/slices/socket.slice";
import authSliceReducer from '../redux/slices/auth.slice'
import chatSliceReducer from '../redux/slices/chat.slice'
import callSliceReducer from '../redux/slices/call.slice'

const Store = configureStore({
    reducer: {
        socket: socketSliceReducer,
        auth: authSliceReducer,
        chat: chatSliceReducer,
        call: callSliceReducer
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware ({ serializableCheck: false }),
    devTools: true
})

export default Store;