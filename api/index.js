import express from "express";
import cors from "cors";
import { connectDB, closeDB, testConnection, getDB } from "../db.js";
import requestRoute from "../routes/request.js";
import commentRoute from "../routes/komentar.js";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/health", async (req, res) => {
  try {
    const db = getDB();
    if (db) {
      await db.command({ ping: 1 });
      res.json({
        status: "OK",
        database: "connected",
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(500).json({ status: "ERROR", database: "disconnected" });
    }
  } catch (error) {
    res.status(500).json({ status: "ERROR", database: "disconnected", error: error.message });
  }
});

// Test database connection endpoint
app.get("/test-db", async (req, res) => {
  const isConnected = await testConnection();
  if (isConnected) {
    res.json({ message: "✅ Database connection successful", database: "MongoDB Atlas" });
  } else {
    res.status(500).json({ error: "❌ Database connection failed" });
  }
});

// Routes
app.use("/api/request", requestRoute);
app.use("/api/comment", commentRoute);

app.get("/", (req, res) => {
  res.json({
    message: "V-Project Band API Ready 🚀",
    database: "MongoDB Atlas",
    endpoints: {
      requests: {
        list: "GET /api/request",
        create: "POST /api/request",
        detail: "GET /api/request/:id",
        update: "PUT /api/request/:id",
        delete: "DELETE /api/request/:id",
      },
      comments: {
        list: "GET /api/comment/:request_id",
        create: "POST /api/comment",
        update: "PUT /api/comment/:id",
        delete: "DELETE /api/comment/:id",
      },
      health: "GET /health",
      testDb: "GET /test-db",
    },
  });
});

// Connect to MongoDB before starting server
async function startServer() {
  try {
    await connectDB();
    await testConnection();

    app.listen(PORT, () => {
      console.log(`\n🚀 Server running on port ${PORT}`);
      console.log(`📍 http://localhost:${PORT}`);
      console.log(`🏥 Health check: http://localhost:${PORT}/health`);
      console.log(`🗄️  Test DB: http://localhost:${PORT}/test-db`);
      console.log(`📋 API Docs: http://localhost:${PORT}/`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    console.log("\n⚠️  Please check:");
    console.log("1. MongoDB Atlas connection string in .env file");
    console.log("2. Network Access IP whitelist in MongoDB Atlas");
    console.log("3. Username and password");
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n🛑 Shutting down gracefully...");
  await closeDB();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n🛑 Shutting down gracefully...");
  await closeDB();
  process.exit(0);
});

startServer();

export default app;
