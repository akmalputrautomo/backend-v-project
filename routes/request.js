import express from "express";
import { v4 as uuid } from "uuid";
import { getDB } from "../db.js";

const router = express.Router();

// GET all requests (not deleted)
router.get("/", async (req, res) => {
  try {
    const db = getDB();
    const collection = db.collection("requests");

    const data = await collection.find({ deleted: 0 }).sort({ timestamp: -1 }).toArray();

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal ambil data" });
  }
});

// GET single request by ID
router.get("/:id", async (req, res) => {
  try {
    const db = getDB();
    const collection = db.collection("requests");

    const data = await collection.findOne({
      id: req.params.id,
      deleted: 0,
    });

    if (!data) {
      return res.status(404).json({ error: "Request tidak ditemukan" });
    }

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal ambil data" });
  }
});

// POST new request
router.post("/", async (req, res) => {
  const { song_title, artist_name, requester_name } = req.body;

  if (!song_title || !artist_name || !requester_name) {
    return res.status(400).json({ message: "Data tidak lengkap" });
  }

  try {
    const db = getDB();
    const collection = db.collection("requests");

    const newData = {
      id: uuid(),
      song_title,
      artist_name,
      requester_name,
      timestamp: new Date().toISOString(),
      deleted: 0,
    };

    await collection.insertOne(newData);
    res.status(201).json(newData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal tambah request" });
  }
});

// SOFT DELETE
router.delete("/:id", async (req, res) => {
  try {
    const db = getDB();
    const collection = db.collection("requests");

    const result = await collection.updateOne({ id: req.params.id }, { $set: { deleted: 1 } });

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Request tidak ditemukan" });
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal hapus request" });
  }
});

// UPDATE request
router.put("/:id", async (req, res) => {
  const { song_title, artist_name, requester_name } = req.body;

  try {
    const db = getDB();
    const collection = db.collection("requests");

    const updateData = {};
    if (song_title) updateData.song_title = song_title;
    if (artist_name) updateData.artist_name = artist_name;
    if (requester_name) updateData.requester_name = requester_name;
    updateData.updated_at = new Date().toISOString();

    const result = await collection.updateOne({ id: req.params.id, deleted: 0 }, { $set: updateData });

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Request tidak ditemukan" });
    }

    const updated = await collection.findOne({ id: req.params.id });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal update request" });
  }
});

export default router;
