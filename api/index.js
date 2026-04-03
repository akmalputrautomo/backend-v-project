import express from "express";
import cors from "cors";
import { connectDB, getDB } from "../db.js";
import requestRoute from "../routes/request.js";
import commentRoute from "../routes/komentar.js";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Global database connection middleware dengan retry logic
let connectionPromise = null;
let connectionAttempts = 0;
const MAX_ATTEMPTS = 3;

async function ensureDatabaseConnection() {
  if (getDB()) {
    return true;
  }

  if (!connectionPromise) {
    connectionPromise = (async () => {
      while (connectionAttempts < MAX_ATTEMPTS) {
        try {
          connectionAttempts++;
          console.log(`🔌 Database connection attempt ${connectionAttempts}/${MAX_ATTEMPTS}`);
          await connectDB();
          console.log("✅ Database connected successfully");
          return true;
        } catch (error) {
          console.error(`❌ Connection attempt ${connectionAttempts} failed:`, error.message);
          if (connectionAttempts >= MAX_ATTEMPTS) {
            throw error;
          }
          // Wait before retry (exponential backoff)
          await new Promise((resolve) => setTimeout(resolve, 1000 * connectionAttempts));
        }
      }
      return false;
    })();
  }

  return connectionPromise;
}

app.use(async (req, res, next) => {
  try {
    // Skip health check endpoint to avoid recursive connection attempts
    if (req.path === "/api/health") {
      return next();
    }

    await ensureDatabaseConnection();
    next();
  } catch (error) {
    console.error("DB Connection Middleware Error:", error);
    res.status(503).json({
      error: "Database service unavailable",
      message: "Unable to connect to database. Please try again later.",
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Routes
app.use("/api/request", requestRoute);
app.use("/api/comment", commentRoute);

// Health check endpoint (doesn't require DB for basic health)
app.get("/api/health", async (req, res) => {
  let dbStatus = "disconnected";
  let dbDetails = {};

  try {
    const db = getDB();
    if (db) {
      await db.command({ ping: 1 });
      dbStatus = "connected";
    }
  } catch (error) {
    dbStatus = "error";
    dbDetails.error = error.message;
  }

  res.json({
    status: "OK",
    database: dbStatus,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    mongodb_uri_configured: !!process.env.MONGODB_URI,
    db_name: process.env.DB_NAME,
    ...dbDetails,
  });
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "V-Project Band API Ready 🚀",
    version: "1.0.0",
    database: process.env.DB_NAME || "v_project_db",
    status: getDB() ? "database_connected" : "database_connecting",
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

// Untuk production (Vercel), cukup export app
// Untuk local development, start server
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 3000;
  connectDB()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
      });
    })
    .catch((err) => {
      console.error("Failed to connect to database on startup:", err);
      process.exit(1);
    });
}

// Export for Vercel
export default app;
