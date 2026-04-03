import express from "express";
import cors from "cors";
import { connectDB, getDB } from "../db.js";
import requestRoute from "../routes/request.js";
import commentRoute from "../routes/komentar.js";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Global middleware to ensure DB connection
app.use(async (req, res, next) => {
  try {
    if (!getDB()) {
      await connectDB();
    }
    next();
  } catch (error) {
    console.error("DB Connection Error:", error);
    res.status(500).json({
      error: "Database connection failed",
      message: error.message,
    });
  }
});

// Routes
app.use("/api/request", requestRoute);
app.use("/api/comment", commentRoute);

// Health check endpoint
app.get("/api/health", (req, res) => {
  const dbStatus = getDB() ? "connected" : "disconnected";
  res.json({
    status: "OK",
    database: dbStatus,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "V-Project Band API Ready 🚀",
    version: "1.0.0",
    database: process.env.DB_NAME || "v_project_db",
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
      health: "GET /api/health",
    },
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Something went wrong!",
    message: err.message,
  });
});

// Handle 404
app.use((req, res) => {
  res.status(404).json({
    error: "Endpoint not found",
    path: req.path,
  });
});

// Connect to database on server start (for local development)
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 3000;
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  });
}

// Export for Vercel
export default app;
