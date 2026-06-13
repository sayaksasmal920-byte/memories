require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const db = require("./services/db");
const storage = require("./services/storage");

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors({
  origin: "*", // Allow all origins for local/vite dev flow
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-admin-secret"]
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Helper to recursively map and sign private cloud URLs in response bodies
async function mapObjectUrls(obj) {
  if (!obj) return obj;

  if (Array.isArray(obj)) {
    return await Promise.all(obj.map(item => mapObjectUrls(item)));
  }

  if (typeof obj === "object") {
    const formatted = obj.toObject ? obj.toObject() : obj;

    if (formatted.storageType === "r2" || formatted.storageType === "s3") {
      if (formatted.fileUrl && !formatted.fileUrl.startsWith("http")) {
        formatted.fileUrl = await storage.getPresignedUrl(formatted.fileUrl);
      }
      if (formatted.thumbnailUrl && !formatted.thumbnailUrl.startsWith("http")) {
        formatted.thumbnailUrl = await storage.getPresignedUrl(formatted.thumbnailUrl);
      }
    }

    for (const key in formatted) {
      if (formatted[key] && typeof formatted[key] === "object") {
        formatted[key] = await mapObjectUrls(formatted[key]);
      }
    }
    return formatted;
  }

  return obj;
}

// Centralized rewrite middleware to map relative local uploads paths to fully qualified host URLs
// and sign private cloud storage assets
app.use((req, res, next) => {
  const originalJson = res.json;
  res.json = async function (body) {
    let formattedBody = body;
    try {
      formattedBody = await mapObjectUrls(body);
    } catch (e) {
      console.error("Error formatting cloud URLs in response:", e);
    }

    if (formattedBody && typeof formattedBody === "object") {
      const host = req.get("host");
      const protocol = req.protocol;
      const baseUrl = `${protocol}://${host}`;
      
      let jsonString = JSON.stringify(formattedBody);
      jsonString = jsonString.replace(/"\/uploads\//g, `"${baseUrl}/uploads/`);
      
      try {
        formattedBody = JSON.parse(jsonString);
      } catch (e) {
        console.error("Error patching uploads path in response:", e);
      }
    }
    return originalJson.call(this, formattedBody);
  };
  next();
});

// Serve local upload directories statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Register Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/media", require("./routes/media"));
app.use("/api/collections", require("./routes/collections"));
app.use("/api/comments", require("./routes/comments"));
app.use("/api/search", require("./routes/search"));

// Root Health check
app.get("/health", (req, res) => {
  res.json({
    status: "online",
    time: new Date(),
    database: db.isMongoConnected() ? "mongodb" : "local-file-db",
    storage: process.env.R2_ACCESS_KEY_ID ? "cloudflare-r2" : "local-disk"
  });
});

// Start Server after DB initiation
async function startServer() {
  await db.connectDb();
  app.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(`🚀 MemoryVault Server listening on port ${PORT}`);
    console.log(`📂 Serving uploads at http://localhost:${PORT}/uploads`);
    console.log(`🩺 Health check: http://localhost:${PORT}/health`);
    console.log(`===============================================`);
  });
}

startServer();

module.exports = app;
// Restart trigger comment
