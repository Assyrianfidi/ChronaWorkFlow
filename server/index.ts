import http from "http";
import { validateEnvironmentVariables, getServerConfig } from "./config/env-validation.js";

// Validate environment variables before starting server
validateEnvironmentVariables();

const { port: PORT, hostname: HOST } = getServerConfig();

const server = http.createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      status: "ok",
      service: "accubooks",
      env: process.env.NODE_ENV || "development"
    }));
  } else {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      message: "AccuBooks Server Running",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development"
    }));
  }
});

server.listen(PORT, HOST, () => {
  console.log(` AccuBooks server running on http://${HOST}:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});
