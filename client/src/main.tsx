import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./utils/errorHandler";

createRoot(document.getElementById("root")!).render(<App />);
