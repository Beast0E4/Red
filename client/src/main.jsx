import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import Store from './redux/store.js'
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")).render(
  <Provider store={Store}>
    <App />
  </Provider>
);
