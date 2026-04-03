import { MongoClient } from "mongodb";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const uri = process.env.MONGODB;
const dbName = process.env.DB_NAME || "v_project_db";

let cachedClient = null;
let cachedDb = null;

export async function connectDB() {
  // Use cached connection if available
  if (cachedDb) {
    return cachedDb;
  }

  if (!uri) {
    throw new Error("MONGODB_URI is not defined in environment variables");
  }

  try {
    console.log("🔄 Connecting to MongoDB...");

    const client = new MongoClient(uri, {
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 10000,
    });

    await client.connect();
    console.log("✅ Connected to MongoDB successfully!");

    const db = client.db(dbName);
    console.log(`📚 Using database: ${dbName}`);

    // Test connection
    await db.command({ ping: 1 });
    console.log("🏓 Database ping successful");

    // Create indexes
    await createIndexes(db);

    // Cache connection
    cachedClient = client;
    cachedDb = db;

    return db;
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    throw error;
  }
}

async function createIndexes(db) {
  try {
    const requestsCollection = db.collection("requests");
    const commentsCollection = db.collection("comments");

    // Create indexes if they don't exist
    await requestsCollection.createIndex({ timestamp: -1 });
    await requestsCollection.createIndex({ deleted: 1 });
    await requestsCollection.createIndex({ id: 1 }, { unique: true });

    await commentsCollection.createIndex({ request_id: 1 });
    await commentsCollection.createIndex({ timestamp: 1 });
    await commentsCollection.createIndex({ id: 1 }, { unique: true });

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
    throw new Error("Database not connected. Call connectDB() first.");
  }
  return cachedDb;
}
