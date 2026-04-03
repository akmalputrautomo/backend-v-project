import express from "express";
import { v4 as uuid } from "uuid";
import { getDB } from "../db.js";

const router = express.Router();

// POST COMMENT
router.post("/", async (req, res) => {
  const { request_id, commenter_name, message } = req.body;

  if (!request_id || !commenter_name || !message) {
    return res.status(400).json({ error: "Data tidak lengkap" });
  }

  try {
    const db = getDB();
    const requestsCollection = db.collection("requests");
    const commentsCollection = db.collection("comments");

    // Check if request exists and not deleted
    const requestExists = await requestsCollection.findOne({
      id: request_id,
      deleted: 0,
    });

    if (!requestExists) {
      return res.status(404).json({ error: "Request tidak ditemukan" });
    }

    const newComment = {
      id: uuid(),
      request_id,
      commenter_name,
      message,
      timestamp: new Date().toISOString(),
    };

    await commentsCollection.insertOne(newComment);
    res.status(201).json(newComment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal tambah komentar" });
  }
});

// GET COMMENTS BY REQUEST
router.get("/:request_id", async (req, res) => {
  try {
    const db = getDB();
    const collection = db.collection("comments");

    const data = await collection.find({ request_id: req.params.request_id }).sort({ timestamp: 1 }).toArray();

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal ambil komentar" });
  }
});

// DELETE COMMENT
router.delete("/:id", async (req, res) => {
  try {
    const db = getDB();
    const collection = db.collection("comments");

    const result = await collection.deleteOne({ id: req.params.id });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Komentar tidak ditemukan" });
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal hapus komentar" });
  }
});

// UPDATE COMMENT
router.put("/:id", async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message tidak boleh kosong" });
  }

  try {
    const db = getDB();
    const collection = db.collection("comments");

    const result = await collection.updateOne(
      { id: req.params.id },
      {
        $set: {
          message,
          updated_at: new Date().toISOString(),
        },
      },
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Komentar tidak ditemukan" });
    }

    const updated = await collection.findOne({ id: req.params.id });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal update komentar" });
  }
});

export default router;
