import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { UserProvider } from "@/context/UserContext";

const root = createRoot(document.getElementById("root")!);
root.render(
  <UserProvider>
    <App />
  </UserProvider>
);
