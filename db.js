import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME || "v_project_db";

let db = null;
let client = null;

export async function connectDB() {
  if (db) return db;

  try {
    console.log("🔄 Connecting to MongoDB Atlas...");
    console.log("📡 Connecting to cluster...");

    // Optional: Add connection options for better stability
    client = new MongoClient(uri, {
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 10000,
    });

    await client.connect();
    console.log("✅ Connected to MongoDB Atlas successfully!");

    db = client.db(dbName);
    console.log(`📚 Using database: ${dbName}`);

    // Test the connection with ping
    await db.command({ ping: 1 });
    console.log("🏓 Database ping successful");

    // Create indexes
    await createIndexes();

    return db;
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    console.log("\n💡 Troubleshooting tips:");
    console.log("1. Check your internet connection");
    console.log("2. Verify MongoDB Atlas is running");
    console.log("3. Check Network Access in MongoDB Atlas");
    console.log("4. Verify username/password in connection string");
    console.log("5. Try using encoded password if contains special characters");
    throw error;
  }
}

async function createIndexes() {
  if (!db) return;

  try {
    const requestsCollection = db.collection("requests");
    const commentsCollection = db.collection("comments");

    // Create indexes for better query performance
    await requestsCollection.createIndex({ timestamp: -1 });
    await requestsCollection.createIndex({ deleted: 1 });
    await requestsCollection.createIndex({ id: 1 }, { unique: true });
    await commentsCollection.createIndex({ request_id: 1 });
    await commentsCollection.createIndex({ timestamp: 1 });
    await commentsCollection.createIndex({ id: 1 }, { unique: true });

    console.log("✅ Indexes created successfully");
  } catch (error) {
    console.warn("⚠️ Index creation warning:", error.message);
  }
}

export async function closeDB() {
  if (client) {
    await client.close();
    console.log("🔒 MongoDB connection closed");
  }
}

export function getDB() {
  if (!db) {
    throw new Error("Database not connected. Call connectDB() first.");
  }
  return db;
}

// Test connection function
export async function testConnection() {
  try {
    const db = await connectDB();
    const collections = await db.listCollections().toArray();
    console.log(
      "📊 Available collections:",
      collections.map((c) => c.name),
    );
    return true;
  } catch (error) {
    console.error("Connection test failed:", error);
    return false;
  }
}
