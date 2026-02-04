import express from "express";
import { v4 as uuid } from "uuid";
import db from "../db.js";

const router = express.Router();

/**
 * GET all request
 */
router.get("/", (req, res) => {
  const data = db.prepare("SELECT * FROM requests WHERE deleted = 0 ORDER BY timestamp DESC").all();

  res.json(data);
});

/**
 * POST new request
 */
router.post("/", (req, res) => {
  const { song_title, artist_name, requester_name } = req.body;

  if (!song_title || !artist_name || !requester_name) {
    return res.status(400).json({ message: "Data tidak lengkap" });
  }

  const newData = {
    id: uuid(),
    song_title,
    artist_name,
    requester_name,
    timestamp: new Date().toISOString(),
    deleted: 0,
  };

  db.prepare(
    ` INSERT INTO requests 
 (id, song_title, artist_name, requester_name, timestamp, deleted)
 VALUES (@id, @song_title, @artist_name, @requester_name, @timestamp, @deleted)
 `,
  ).run(newData);

  res.status(201).json(newData);
});

/**
 * SOFT DELETE (ADMIN)
 */
router.delete("/:id", (req, res) => {
  db.prepare("UPDATE requests SET deleted = 1 WHERE id = ?").run(req.params.id);

  res.json({ success: true });
});

export default router;
