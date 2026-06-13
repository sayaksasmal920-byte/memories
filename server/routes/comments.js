const express = require("express");
const router = express.Router();
const db = require("../services/db");
const { verifyUserToken } = require("../middleware/auth");

// 1. Add comment to media item
router.post("/", verifyUserToken, async (req, res) => {
  const { mediaId, text } = req.body;

  if (!mediaId || !text || text.trim().length === 0) {
    return res.status(400).json({ error: "Media ID and comment text are required." });
  }

  try {
    const mediaItem = await db.Media.findById(mediaId);
    if (!mediaItem) {
      return res.status(404).json({ error: "Cannot comment on non-existent media." });
    }

    const newComment = await db.Comment.create({
      mediaId,
      text: text.trim(),
    });

    return res.json(newComment);
  } catch (err) {
    console.error("Create comment error:", err);
    return res.status(500).json({ error: "Failed to add comment." });
  }
});

// 2. Delete comment
router.delete("/:id", verifyUserToken, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.Comment.deleteOne({ _id: id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Comment not found." });
    }
    return res.json({ message: "Comment deleted successfully." });
  } catch (err) {
    console.error("Delete comment error:", err);
    return res.status(500).json({ error: "Failed to delete comment." });
  }
});

module.exports = router;
