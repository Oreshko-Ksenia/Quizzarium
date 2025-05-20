import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import UserStore from "./store/UserStore";
import { BrowserRouter } from "react-router-dom";

const userStore = new UserStore();

export const Context = React.createContext({
  user: userStore,
});

const root = ReactDOM.createRoot(document.getElementById("root")!);
root.render(
  <Context.Provider value={{ user: userStore }}>
      <App />
  </Context.Provider>
);
