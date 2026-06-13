const express = require("express");
const router = express.Router();
const multer = require("multer");
const AdmZip = require("adm-zip");
const db = require("../services/db");
const storage = require("../services/storage");
const { verifyUserToken } = require("../middleware/auth");
const heicConvert = require("heic-convert");

// Set up Multer memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100 MB max file size
  },
});

// Helper: Convert HEIC/HEIF buffer to JPEG so browsers can display it
async function convertIfHeic(buffer, mimeType, originalName) {
  const isHeic =
    mimeType === "image/heic" ||
    mimeType === "image/heif" ||
    /\.(heic|heif)$/i.test(originalName);

  if (!isHeic) return { buffer, mimeType, originalName };

  try {
    const jpegBuffer = await heicConvert({
      buffer: buffer,
      format: "JPEG",
      quality: 0.92,
    });
    const newName = originalName.replace(/\.(heic|heif)$/i, ".jpg");
    return {
      buffer: Buffer.from(jpegBuffer),
      mimeType: "image/jpeg",
      originalName: newName,
    };
  } catch (err) {
    console.error("HEIC conversion failed, uploading original:", err.message);
    return { buffer, mimeType, originalName };
  }
}

// Helper: suggest tags based on title/text
function suggestTags(text) {
  if (!text) return [];
  const words = text.toLowerCase().split(/\s+/);
  const suggestions = new Set();
  
  const rules = {
    college: ["college", "university", "campus", "farewell", "graduation", "degree", "class"],
    friends: ["friend", "friends", "squad", "trip", "group", "farewell", "party", "goa", "sunset"],
    farewell: ["farewell", "bye", "last day", "party"],
    nature: ["nature", "sunset", "beach", "sunrise", "mountain", "hills", "forest", "lake"],
    travel: ["travel", "trip", "goa", "vacation", "journey", "flight", "roadtrip"],
    food: ["food", "dinner", "lunch", "cafe", "restaurant", "eat", "coffee"],
    party: ["party", "celebration", "birthday", "cake", "dance", "night"],
  };

  for (const [tag, keywords] of Object.entries(rules)) {
    if (keywords.some(kw => words.some(w => w.includes(kw)))) {
      suggestions.add(tag);
    }
  }

  // Also include the words themselves if they are long
  words.forEach(w => {
    const cleanWord = w.replace(/[^a-z0-9]/g, "");
    if (cleanWord.length > 4 && !["about", "there", "their", "where", "would", "could", "should"].includes(cleanWord)) {
      suggestions.add(cleanWord);
    }
  });

  return Array.from(suggestions).slice(0, 5);
}

// 1. Upload Media (Single or Multiple)
// Accepts a primary media file and an optional thumbnail (mostly for videos)
router.post(
  "/upload",
  verifyUserToken,
  upload.fields([
    { name: "file", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  async (req, res) => {
    const userId = req.user._id || req.user.id;
    const { title = "", story = "", mediaDate, mediaType, collectionId, tags } = req.body;

    const files = req.files;
    if (!files || !files["file"]) {
      return res.status(400).json({ error: "No media file uploaded." });
    }

    const primaryFile = files["file"][0];
    let mimeType = primaryFile.mimetype;
    let originalName = primaryFile.originalname;
    let fileBuffer = primaryFile.buffer;

    // Convert HEIC/HEIF to JPEG transparently before any processing
    ({ buffer: fileBuffer, mimeType, originalName } = await convertIfHeic(
      fileBuffer,
      mimeType,
      originalName
    ));
    if (mimeType === "image/heic" || mimeType === "image/heif") {
      console.log(`[HEIC] Converted ${originalName} → JPEG`);
    }

    try {
      let parsedTags = [];
      if (tags) {
        try {
          parsedTags = JSON.parse(tags);
        } catch (_) {
          parsedTags = tags.split(",").map(t => t.trim()).filter(Boolean);
        }
      }

      // Automatically suggest smart tags if none are provided
      if (parsedTags.length === 0 && title) {
        parsedTags = suggestTags(title);
      }

      // Check if ZIP Sticker Pack
      if (mediaType === "sticker" && (mimeType === "application/zip" || originalName.endsWith(".zip"))) {
        const zip = new AdmZip(primaryFile.buffer);
        const zipEntries = zip.getEntries();
        const createdStickers = [];

        for (const entry of zipEntries) {
          if (entry.isDirectory) continue;
          
          // Verify it's an image/webp
          const entryExt = path.extname(entry.name).toLowerCase();
          if ([".webp", ".png", ".jpg", ".jpeg", ".gif"].includes(entryExt)) {
            const fileBuffer = entry.getData();
            const entryMime = entryExt === ".webp" ? "image/webp" : `image/${entryExt.slice(1)}`;
            
            // Upload to storage
            const uploadRes = await storage.uploadFile(fileBuffer, entry.name, entryMime, "sticker");
            
            // Create in database
            const newSticker = await db.Media.create({
              userId,
              fileName: entry.name,
              fileUrl: uploadRes.fileUrl,
              thumbnailUrl: uploadRes.fileUrl,
              mediaType: "sticker",
              title: title || entry.name.replace(/\.[^/.]+$/, ""),
              story,
              tags: parsedTags,
              mediaDate: mediaDate ? new Date(mediaDate) : new Date(),
              uploadedAt: new Date(),
              storageType: uploadRes.storageType,
            });
            createdStickers.push(newSticker);
          }
        }

        return res.json({
          message: `Sticker pack extracted successfully. Created ${createdStickers.length} stickers.`,
          media: createdStickers,
        });
      }

      // ── Standard Media Upload (Photo, Video, Sticker) ──────────────────────
      const category = mediaType || (mimeType.startsWith("video/") ? "video" : "photo");

      // Upload primary file (fileBuffer may be HEIC-converted JPEG)
      const uploadRes = await storage.uploadFile(fileBuffer, originalName, mimeType, category);

      // Upload thumbnail if provided (typically generated by client video canvas)
      let thumbnailUrl = uploadRes.fileUrl; // Fallback
      if (files["thumbnail"]) {
        const thumbFile = files["thumbnail"][0];
        const thumbRes = await storage.uploadFile(thumbFile.buffer, thumbFile.originalname, thumbFile.mimetype, "thumbnail");
        thumbnailUrl = thumbRes.fileUrl;
      }

      // Save database record
      const mediaItem = await db.Media.create({
        userId,
        fileName: originalName,
        fileUrl: uploadRes.fileUrl,
        thumbnailUrl,
        mediaType: category,
        title,
        story,
        tags: parsedTags,
        mediaDate: mediaDate ? new Date(mediaDate) : new Date(),
        uploadedAt: new Date(),
        collectionId: collectionId || null,
        favorite: false,
        views: 0,
        relationships: [],
        storageType: uploadRes.storageType,
      });

      return res.json({
        message: "Media uploaded successfully.",
        media: mediaItem,
      });
    } catch (err) {
      console.error("Upload error:", err);
      return res.status(500).json({ error: "Failed to upload and store media." });
    }
  }
);

// 2. Get All User Media with Filtering
router.get("/", verifyUserToken, async (req, res) => {
  const userId = req.user._id || req.user.id;
  const { type, favorite, collectionId, hasStory } = req.query;

  try {
    const query = { userId };
    if (type) query.mediaType = type;
    if (favorite !== undefined) query.favorite = favorite === "true";
    if (collectionId !== undefined) query.collectionId = collectionId === "null" ? null : collectionId;

    let mediaList = await db.Media.find(query);

    // Apply client-side story filter for hasStory query
    if (hasStory !== undefined) {
      const needsStory = hasStory === "true";
      mediaList = mediaList.filter(item => {
        const empty = !item.story || item.story.trim().length === 0;
        return needsStory ? !empty : empty;
      });
    }

    // Sort by mediaDate descending
    mediaList.sort((a, b) => new Date(b.mediaDate) - new Date(a.mediaDate));

    return res.json(mediaList);
  } catch (err) {
    console.error("Fetch media error:", err);
    return res.status(500).json({ error: "Failed to fetch media library." });
  }
});

// 3. Get Monthly Timeline Heatmap
router.get("/heatmap", verifyUserToken, async (req, res) => {
  const userId = req.user._id || req.user.id;
  try {
    const mediaList = await db.Media.find({ userId });
    
    // Group count by year and month
    const heatmap = {};
    mediaList.forEach(item => {
      const date = new Date(item.mediaDate);
      const year = date.getFullYear();
      const month = date.getMonth(); // 0-11
      
      if (!heatmap[year]) {
        heatmap[year] = Array(12).fill(0);
      }
      heatmap[year][month]++;
    });

    return res.json(heatmap);
  } catch (err) {
    console.error("Heatmap loading failed:", err);
    return res.status(500).json({ error: "Failed to load timeline heatmap data." });
  }
});

// 4. Suggest Similar Uploads (Same Date, Tags, or Location/Title keywords)
router.get("/similar", verifyUserToken, async (req, res) => {
  const userId = req.user._id || req.user.id;
  const { mediaDate, tags, title, excludeId } = req.query;

  try {
    const list = await db.Media.find({ userId });
    const matchResults = [];
    const targetDate = mediaDate ? new Date(mediaDate) : null;
    const targetTags = tags ? tags.split(",") : [];
    const targetWords = title ? title.toLowerCase().split(/\s+/) : [];

    list.forEach(item => {
      if (item._id === excludeId || item.id === excludeId) return;

      let score = 0;
      
      // Date proximity (within 24 hours)
      if (targetDate && item.mediaDate) {
        const diffHrs = Math.abs(new Date(item.mediaDate) - targetDate) / (1000 * 60 * 60);
        if (diffHrs <= 24) score += 3;
        else if (diffHrs <= 72) score += 1;
      }

      // Tag matching
      if (targetTags.length > 0 && item.tags) {
        const commonTags = item.tags.filter(t => targetTags.includes(t));
        score += commonTags.length * 2;
      }

      // Title match
      if (targetWords.length > 0 && item.title) {
        const itemWords = item.title.toLowerCase().split(/\s+/);
        const matches = itemWords.filter(w => targetWords.includes(w) && w.length > 3);
        score += matches.length * 2.5;
      }

      if (score > 1) {
        matchResults.push({ media: item, score });
      }
    });

    matchResults.sort((a, b) => b.score - a.score);
    return res.json(matchResults.slice(0, 5).map(m => m.media));
  } catch (err) {
    console.error("Similar media check error:", err);
    return res.status(500).json({ error: "Failed to check similar media." });
  }
});

// 5. Get Single Media (Increments Views)
router.get("/:id", verifyUserToken, async (req, res) => {
  const { id } = req.params;
  try {
    const item = await db.Media.findById(id);
    if (!item) {
      return res.status(404).json({ error: "Media item not found." });
    }

    // Increment view count
    const updated = await db.Media.findByIdAndUpdate(id, {
      $inc: { views: 1 },
    });

    const comments = await db.Comment.find({ mediaId: id });

    const mediaObj = updated.toObject ? updated.toObject() : updated;

    return res.json({
      media: { ...mediaObj, views: (mediaObj.views || 0) + 1 },
      comments,
    });
  } catch (err) {
    console.error("Fetch single media error:", err);
    return res.status(500).json({ error: "Failed to load media item." });
  }
});

// 6. Update Media Details (Journal edit)
router.put("/:id", verifyUserToken, async (req, res) => {
  const { id } = req.params;
  const { title, story, tags, mediaDate, favorite, collectionId, relationships } = req.body;

  try {
    const fields = {};
    if (title !== undefined) fields.title = title;
    if (story !== undefined) fields.story = story;
    if (tags !== undefined) fields.tags = Array.isArray(tags) ? tags : JSON.parse(tags);
    if (mediaDate !== undefined) fields.mediaDate = new Date(mediaDate);
    if (favorite !== undefined) fields.favorite = favorite;
    if (collectionId !== undefined) fields.collectionId = collectionId === "null" ? null : collectionId;
    if (relationships !== undefined) fields.relationships = Array.isArray(relationships) ? relationships : JSON.parse(relationships);

    const updated = await db.Media.findByIdAndUpdate(id, { $set: fields });
    if (!updated) {
      return res.status(404).json({ error: "Media not found to edit." });
    }

    return res.json({ message: "Memory journal updated.", media: updated });
  } catch (err) {
    console.error("Update media error:", err);
    return res.status(500).json({ error: "Failed to update memory." });
  }
});

// 7. Delete Media
router.delete("/:id", verifyUserToken, async (req, res) => {
  const { id } = req.params;
  try {
    const item = await db.Media.findById(id);
    if (!item) {
      return res.status(404).json({ error: "Media item not found." });
    }

    // Try deleting primary file & thumbnail
    const storageType = item.storageType || "local";
    await storage.deleteFile(item.fileUrl, storageType, item.fileUrl);
    if (item.thumbnailUrl && item.thumbnailUrl !== item.fileUrl) {
      await storage.deleteFile(item.thumbnailUrl, storageType, item.thumbnailUrl);
    }

    // Delete db record
    await db.Media.deleteOne({ _id: id });
    // Delete related comments
    await db.Comment.deleteMany({ mediaId: id });

    return res.json({ message: "Memory deleted successfully." });
  } catch (err) {
    console.error("Delete media error:", err);
    return res.status(500).json({ error: "Failed to delete memory." });
  }
});

// 8. Download Multiple Media Files as a ZIP Bundle
router.post("/download-bundle", verifyUserToken, async (req, res) => {
  const { mediaIds } = req.body;
  if (!mediaIds || !Array.isArray(mediaIds) || mediaIds.length === 0) {
    return res.status(400).json({ error: "Provide an array of media IDs to zip." });
  }

  try {
    const zip = new AdmZip();
    const mediaItems = await db.Media.find({});
    const itemsToZip = mediaItems.filter(item => mediaIds.includes(item._id) || mediaIds.includes(item.id));

    if (itemsToZip.length === 0) {
      return res.status(404).json({ error: "No matching media items found." });
    }

    const fs = require("fs");
    const path = require("path");

    for (const item of itemsToZip) {
      // Determine file location
      if (item.fileUrl.startsWith("/uploads/")) {
        const localPath = path.join(__dirname, "../..", item.fileUrl);
        if (fs.existsSync(localPath)) {
          zip.addLocalFile(localPath);
        }
      } else {
        // Fetch remote cloud resource
        try {
          const fetch = (...args) => import("node-fetch").then(({default: fetch}) => fetch(...args));
          const response = await fetch(item.fileUrl);
          const buffer = await response.buffer();
          zip.addFile(item.fileName, buffer);
        } catch (fetchErr) {
          console.error(`Failed to download remote file for ZIP: ${item.fileUrl}`, fetchErr);
        }
      }
    }

    const zipBuffer = zip.toBuffer();
    res.setHeader("Content-Disposition", "attachment; filename=memoryvault-bundle.zip");
    res.setHeader("Content-Type", "application/zip");
    res.send(zipBuffer);
  } catch (err) {
    console.error("ZIP packaging error:", err);
    return res.status(500).json({ error: "Failed to generate ZIP download bundle." });
  }
});

// 9. Manage Relationships Link
router.post("/:id/relate", verifyUserToken, async (req, res) => {
  const { id } = req.params;
  const { relatedId } = req.body;

  if (!relatedId) {
    return res.status(400).json({ error: "Related media ID is required." });
  }

  try {
    const mediaA = await db.Media.findById(id);
    const mediaB = await db.Media.findById(relatedId);

    if (!mediaA || !mediaB) {
      return res.status(404).json({ error: "One of the media items was not found." });
    }

    const relA = new Set(mediaA.relationships || []);
    const relB = new Set(mediaB.relationships || []);

    relA.add(relatedId);
    relB.add(id);

    await db.Media.findByIdAndUpdate(id, { $set: { relationships: Array.from(relA) } });
    await db.Media.findByIdAndUpdate(relatedId, { $set: { relationships: Array.from(relB) } });

    return res.json({ message: "Media relationship established." });
  } catch (err) {
    console.error("Relate media error:", err);
    return res.status(500).json({ error: "Failed to relate media." });
  }
});

module.exports = router;
