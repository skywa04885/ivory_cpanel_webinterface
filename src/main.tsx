import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import { socket } from "./states";
import { SnackbarProvider } from "notistack";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <SnackbarProvider maxSnack={5}>
      <App socket={socket} />
    </SnackbarProvider>
  </React.StrictMode>
);
