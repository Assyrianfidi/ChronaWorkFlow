import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./styles/dynamic-theme.css";
import "./styles/view-architecture.css";
import "./utils/errorHandler";

createRoot(document.getElementById("root")!).render(<App />);
