import Database from "better-sqlite3";

const db = new Database("request.db");

// Tabel Requests
db.prepare(
  `
 CREATE TABLE IF NOT EXISTS requests (
  id TEXT PRIMARY KEY,
  song_title TEXT,
  artist_name TEXT,
  requester_name TEXT,
  timestamp TEXT,
  deleted INTEGER DEFAULT 0
 )
`,
).run();

// Tabel Comments (BARU)
db.prepare(
  `
 CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  request_id TEXT,
  commenter_name TEXT,
  message TEXT,
  parent_comment_id TEXT DEFAULT NULL,
  timestamp TEXT,
  FOREIGN KEY (request_id) REFERENCES requests (id) ON DELETE CASCADE
 )
`,
).run();

export default db;
