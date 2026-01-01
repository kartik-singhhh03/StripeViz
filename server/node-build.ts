import path from "path";
import { createServer } from "./index";
import * as express from "express";

const app = createServer();
const PORT = Number(process.env.PORT) || 8080;
const HOST = "0.0.0.0";

// In production, serve the built SPA files
const __dirname = import.meta.dirname;
const distPath = path.join(__dirname, "../spa");

// Serve static files
app.use(express.static(distPath));

// Health check endpoint (before SPA fallback)
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// Handle React Router - serve index.html for all non-API routes
// Using middleware function instead of wildcard to avoid path-to-regexp issues
app.use((req, res, next) => {
  // Skip API routes
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ error: "API endpoint not found" });
  }
  // Serve SPA for all other routes
  res.sendFile(path.join(distPath, "index.html"));
});

// Start server with explicit host binding
const server = app.listen(PORT, HOST, () => {
  console.log(`✅ Server started successfully`);
  console.log(`🚀 Listening on http://${HOST}:${PORT}`);
  console.log(`🔧 API: http://${HOST}:${PORT}/api`);
  console.log(`❤️  Health: http://${HOST}:${PORT}/health`);
});

server.on("error", (err: NodeJS.ErrnoException) => {
  if (err.code === "EADDRINUSE") {
    console.error(`❌ Port ${PORT} is already in use`);
  } else {
    console.error(`❌ Server error:`, err);
  }
  process.exit(1);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("🛑 Received SIGTERM, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("🛑 Received SIGINT, shutting down gracefully");
  process.exit(0);
});
