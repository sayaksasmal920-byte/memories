/**
 * Sync Local Database and Files to Cloud (MongoDB & Backblaze B2)
 * Run this script to migrate local data up to your deployment.
 */
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const db = require("./services/db");
const storage = require("./services/storage");

const JSON_DB_PATH = path.join(__dirname, "database_store.json");

// Helper to determine mime type
function getMimeType(fileName) {
  const ext = path.extname(fileName).toLowerCase();
  switch (ext) {
    case ".jpg":
    case ".jpeg": return "image/jpeg";
    case ".png": return "image/png";
    case ".gif": return "image/gif";
    case ".webp": return "image/webp";
    case ".mp4": return "video/mp4";
    case ".mov": return "video/quicktime";
    case ".webm": return "video/webm";
    default: return "application/octet-stream";
  }
}

async function sync() {
  console.log("=== MemoryVault Cloud Sync ===");

  // 1. Connect to MongoDB Atlas
  const isConnected = await db.connectDb();
  if (!isConnected) {
    console.error("❌ Error: Could not connect to MongoDB Atlas. Ensure MONGODB_URI is correctly set in your server/.env file.");
    process.exit(1);
  }

  // 2. Read local JSON database
  if (!fs.existsSync(JSON_DB_PATH)) {
    console.log("ℹ️ No local database_store.json found. Nothing to sync.");
    process.exit(0);
  }

  let localData;
  try {
    localData = JSON.parse(fs.readFileSync(JSON_DB_PATH, "utf8"));
  } catch (err) {
    console.error("❌ Error reading database_store.json:", err.message);
    process.exit(1);
  }

  // 3. Migrate Users and create ID mapping
  const userMap = {}; // { localUserId: mongoUserId }
  console.log("\n👤 Syncing users...");
  const localUsers = localData.users || [];
  
  for (const user of localUsers) {
    try {
      let mongoUser = await db.User.findOne({ inviteToken: user.inviteToken });
      if (!mongoUser) {
        mongoUser = await db.User.create({
          inviteToken: user.inviteToken,
          passwordHash: user.passwordHash,
          mustChangePassword: user.mustChangePassword || false,
          createdAt: user.createdAt || new Date(),
        });
        console.log(`✅ Migrated user invite: /u/${user.inviteToken}`);
      } else {
        console.log(`ℹ️ User invite /u/${user.inviteToken} already exists in MongoDB.`);
      }
      userMap[user._id] = mongoUser._id.toString();
    } catch (err) {
      console.error(`❌ Failed to sync user ${user.inviteToken}:`, err.message);
    }
  }

  // 4. Migrate Media & Upload Local Files to Backblaze B2
  console.log("\n🖼️ Syncing media files...");
  const localMediaList = localData.media || [];
  
  for (const media of localMediaList) {
    try {
      const mappedUserId = userMap[media.userId];
      if (!mappedUserId) {
        console.warn(`⚠️ Skipping media "${media.fileName}" as owner user could not be found/mapped.`);
        continue;
      }

      // Check if media already exists in MongoDB
      // We look up by title, mediaType, and mappedUserId
      const existingMedia = await db.Media.findOne({
        userId: mappedUserId,
        fileName: media.fileName,
        mediaDate: media.mediaDate,
      });

      if (existingMedia) {
        console.log(`ℹ️ Media "${media.fileName}" already exists in MongoDB.`);
        continue;
      }

      let fileUrl = media.fileUrl;
      let thumbnailUrl = media.thumbnailUrl;
      let storageType = media.storageType || "local";

      // If the file is stored locally, we need to upload it to cloud storage
      if (fileUrl.startsWith("/uploads/")) {
        const localPath = path.join(__dirname, fileUrl);
        if (fs.existsSync(localPath)) {
          console.log(`📤 Uploading "${media.fileName}" from local disk to Backblaze B2...`);
          const fileBuffer = fs.readFileSync(localPath);
          const mimeType = getMimeType(media.fileName);
          
          // Upload raw file
          const uploadRes = await storage.uploadFile(fileBuffer, media.fileName, mimeType, media.mediaType);
          fileUrl = uploadRes.fileUrl;
          storageType = uploadRes.storageType;
          
          // Handle thumbnail if it matches the main file path or upload it if distinct
          if (thumbnailUrl && thumbnailUrl.startsWith("/uploads/")) {
            thumbnailUrl = fileUrl; // For simplicity, point thumbnail to same cloud URL
          }
          console.log(`   ➡️ Upload complete. Key: ${fileUrl}`);
        } else {
          console.warn(`⚠️ Warning: Local file not found on disk at "${localPath}". Skipping cloud upload.`);
          continue;
        }
      }

      // Save record in MongoDB
      await db.Media.create({
        userId: mappedUserId,
        fileName: media.fileName,
        fileUrl: fileUrl,
        thumbnailUrl: thumbnailUrl,
        mediaType: media.mediaType,
        title: media.title || "",
        story: media.story || "",
        tags: media.tags || [],
        mediaDate: media.mediaDate || new Date(),
        uploadedAt: media.uploadedAt || new Date(),
        favorite: media.favorite || false,
        views: media.views || 0,
        collectionId: media.collectionId || null,
        relationships: media.relationships || [],
        storageType: storageType,
      });

      console.log(`✅ Saved media record: "${media.title || media.fileName}"`);
    } catch (err) {
      console.error(`❌ Failed to sync media "${media.fileName}":`, err.message);
    }
  }

  console.log("\n🎉 Synchronization complete!");
  process.exit(0);
}

sync();
