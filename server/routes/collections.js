const express = require("express");
const router = express.Router();
const db = require("../services/db");
const { verifyUserToken } = require("../middleware/auth");

// 1. Get all collections
router.get("/", verifyUserToken, async (req, res) => {
  const userId = req.user._id || req.user.id;
  try {
    const list = await db.Collection.find({});
    return res.json(list);
  } catch (err) {
    console.error("Fetch collections error:", err);
    return res.status(500).json({ error: "Failed to load life events." });
  }
});

// 2. Create a collection
router.post("/", verifyUserToken, async (req, res) => {
  const userId = req.user._id || req.user.id;
  const { name, description = "", coverMediaUrl = "" } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Collection name is required." });
  }

  try {
    const newCollection = await db.Collection.create({
      userId,
      name,
      description,
      coverMediaUrl,
    });
    return res.json(newCollection);
  } catch (err) {
    console.error("Create collection error:", err);
    return res.status(500).json({ error: "Failed to create life event." });
  }
});

// 3. Update collection details
router.put("/:id", verifyUserToken, async (req, res) => {
  const { id } = req.params;
  const { name, description, coverMediaUrl } = req.body;

  try {
    const fields = {};
    if (name !== undefined) fields.name = name;
    if (description !== undefined) fields.description = description;
    if (coverMediaUrl !== undefined) fields.coverMediaUrl = coverMediaUrl;

    const updated = await db.Collection.findByIdAndUpdate(id, { $set: fields });
    if (!updated) {
      return res.status(404).json({ error: "Life event collection not found." });
    }

    return res.json({ message: "Collection updated.", collection: updated });
  } catch (err) {
    console.error("Update collection error:", err);
    return res.status(500).json({ error: "Failed to update life event." });
  }
});

// 4. Delete collection (detaches media collection ids)
router.delete("/:id", verifyUserToken, async (req, res) => {
  const { id } = req.params;
  try {
    const removed = await db.Collection.deleteOne({ _id: id });
    if (removed.deletedCount === 0) {
      return res.status(404).json({ error: "Collection not found." });
    }

    // Detach collection from all media
    const allMedia = await db.Media.find({ collectionId: id });
    for (const item of allMedia) {
      await db.Media.findByIdAndUpdate(item._id || item.id, { $set: { collectionId: null } });
    }

    return res.json({ message: "Collection deleted, media items detached." });
  } catch (err) {
    console.error("Delete collection error:", err);
    return res.status(500).json({ error: "Failed to delete collection." });
  }
});

module.exports = router;
