import express from "express";
import { v4 as uuid } from "uuid";
import db from "../db.js";

const router = express.Router();

/* ================= POST COMMENT ================= */
router.post("/", (req, res) => {
  const { request_id, commenter_name, message } = req.body;

  if (!request_id || !commenter_name || !message) {
    return res.status(400).json({ error: "Data tidak lengkap" });
  }

  try {
    const newComment = {
      id: uuid(),
      request_id,
      commenter_name,
      message,
      timestamp: new Date().toISOString(),
    };

    db.prepare(
      `
      INSERT INTO comments (id, request_id, commenter_name, message, timestamp)
      VALUES (@id, @request_id, @commenter_name, @message, @timestamp)
    `,
    ).run(newComment);

    res.status(201).json(newComment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal tambah komentar" });
  }
});

/* ================= GET COMMENT BY REQUEST ================= */
router.get("/:request_id", (req, res) => {
  try {
    const data = db
      .prepare(
        `
      SELECT * FROM comments
      WHERE request_id = ?
      ORDER BY timestamp ASC
    `,
      )
      .all(req.params.request_id);

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal ambil komentar" });
  }
});

export default router;
