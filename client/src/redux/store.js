import { configureStore } from "@reduxjs/toolkit";
import socketSliceReducer from "../redux/slices/socket.slice";
import authSliceReducer from '../redux/slices/auth.slice'
import chatSliceReducer from '../redux/slices/chat.slice'

const Store = configureStore({
    reducer: {
        socket: socketSliceReducer,
        auth: authSliceReducer,
        chat: chatSliceReducer
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware({serializableCheck: false}),
    devTools: true
})

export default Store;