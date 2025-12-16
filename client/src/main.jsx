import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import Store from './redux/store.js'
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import './index.css'

ReactDOM.createRoot(document.getElementById("root")).render(
    <BrowserRouter>
        <Provider store={Store}>
            <App />
        </Provider>
  </BrowserRouter>
);
