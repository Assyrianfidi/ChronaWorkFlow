import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./styles/dynamic-theme.css";
import "./styles/view-architecture.css";
import "./utils/errorHandler";

// VERSION STAMP - Verify deployment
console.log("🚀 ChronaWorkFlow Frontend");
console.log("📦 BUILD VERSION:", "1a5f1fc4f4a34826fe25c271e6f8fc4b178c5294");
console.log("📅 BUILD TIME:", new Date().toISOString());
console.log("🔧 COMMIT MESSAGE:", "PHASE 5: Create enforcedTheme.css and consolidate CSS imports");

createRoot(document.getElementById("root")!).render(<App />);
