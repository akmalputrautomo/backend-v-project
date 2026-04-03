import { MongoClient } from "mongodb";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME || "v_project_db";

let cachedClient = null;
let cachedDb = null;

export async function connectDB() {
  // Use cached connection if available and still connected
  if (cachedDb) {
    try {
      // Test if connection is still alive
      await cachedDb.command({ ping: 1 });
      console.log("✅ Using existing database connection");
      return cachedDb;
    } catch (error) {
      console.warn("⚠️ Cached connection is dead, reconnecting...");
      cachedClient = null;
      cachedDb = null;
    }
  }

  if (!uri) {
    console.error("❌ MONGODB_URI is not defined in environment variables");
    throw new Error("MONGODB_URI is not defined in environment variables");
  }

  console.log("🔄 Creating new MongoDB connection...");
  console.log(`📊 Using database: ${dbName}`);
  console.log(`🔗 Connection string present: ${uri.substring(0, 20)}...`);

  try {
    const client = new MongoClient(uri, {
      connectTimeoutMS: 30000, // Increased timeout for serverless
      socketTimeoutMS: 60000,
      serverSelectionTimeoutMS: 30000,
      maxPoolSize: 1, // Serverless: keep pool small
      minPoolSize: 1,
    });

    await client.connect();
    console.log("✅ MongoDB client connected");

    const db = client.db(dbName);

    // Test connection
    await db.command({ ping: 1 });
    console.log("🏓 Database ping successful");

    // Create indexes (non-blocking in production)
    createIndexes(db).catch((err) => {
      console.warn("⚠️ Index creation warning:", err.message);
    });

    // Cache connection
    cachedClient = client;
    cachedDb = db;

    console.log("✅ Database connection established and cached");
    return db;
  } catch (error) {
    console.error("❌ MongoDB connection error:", {
      message: error.message,
      code: error.code,
      name: error.name,
    });
    throw error;
  }
}

async function createIndexes(db) {
  try {
    const requestsCollection = db.collection("requests");
    const commentsCollection = db.collection("comments");

    await Promise.all([
      requestsCollection.createIndex({ timestamp: -1 }),
      requestsCollection.createIndex({ deleted: 1 }),
      requestsCollection.createIndex({ id: 1 }, { unique: true }),
      commentsCollection.createIndex({ request_id: 1 }),
      commentsCollection.createIndex({ timestamp: 1 }),
      commentsCollection.createIndex({ id: 1 }, { unique: true }),
    ]);

    console.log("✅ Indexes created/verified successfully");
  } catch (error) {
    console.warn("⚠️ Index creation warning:", error.message);
  }
}

export async function closeDB() {
  if (cachedClient) {
    await cachedClient.close();
    cachedClient = null;
    cachedDb = null;
    console.log("🔒 MongoDB connection closed");
  }
}

export function getDB() {
  if (!cachedDb) {
    return null; // Return null instead of throwing error
  }
  return cachedDb;
}
