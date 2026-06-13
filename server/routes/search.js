const express = require("express");
const router = express.Router();
const db = require("../services/db");
const { verifyUserToken } = require("../middleware/auth");

// Search user's memories by title, story, tags, or file name
router.get("/", verifyUserToken, async (req, res) => {
  const userId = req.user._id || req.user.id;
  const { q } = req.query;

  if (!q || q.trim().length === 0) {
    return res.json([]);
  }

  const queryTerm = q.trim().toLowerCase();

  try {
    const allMedia = await db.Media.find({ userId });
    
    // Perform filtering based on keyword match
    const matches = allMedia.filter(item => {
      const titleMatch = item.title && item.title.toLowerCase().includes(queryTerm);
      const storyMatch = item.story && item.story.toLowerCase().includes(queryTerm);
      const fileMatch = item.fileName && item.fileName.toLowerCase().includes(queryTerm);
      const tagMatch = item.tags && item.tags.some(t => t.toLowerCase().includes(queryTerm));

      return titleMatch || storyMatch || fileMatch || tagMatch;
    });

    // Sort matching files by mediaDate descending
    matches.sort((a, b) => new Date(b.mediaDate) - new Date(a.mediaDate));

    return res.json(matches);
  } catch (err) {
    console.error("Search media query failed:", err);
    return res.status(500).json({ error: "Failed to search memories." });
  }
});

module.exports = router;
