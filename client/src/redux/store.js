import { configureStore } from "@reduxjs/toolkit";
import socketSliceReducer from "../redux/slices/socket.slice";

const Store = configureStore({
    reducer: {
        socket: socketSliceReducer,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware({serializableCheck: false}),
    devTools: true
})

export default Store;