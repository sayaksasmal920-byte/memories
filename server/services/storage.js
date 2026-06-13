const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const { S3Client } = require("@aws-sdk/client-s3");

// Initialize R2 client lazily if details are in environment
let s3Client = null;
let R2_BUCKET = "";
let R2_PUBLIC_URL = "";

function initR2() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const s3Endpoint = process.env.S3_ENDPOINT;
  R2_BUCKET = process.env.R2_BUCKET_NAME || "";
  R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || "";

  if (accessKeyId && secretAccessKey && R2_BUCKET && (s3Endpoint || accountId)) {
    try {
      let endpoint = s3Endpoint || `https://${accountId}.r2.cloudflarestorage.com`;
      if (s3Endpoint && !s3Endpoint.startsWith("http://") && !s3Endpoint.startsWith("https://")) {
        endpoint = `https://${s3Endpoint}`;
      }
      
      let region = "auto";
      if (s3Endpoint && s3Endpoint.includes("backblazeb2.com")) {
        const match = s3Endpoint.match(/s3\.([a-z0-9-]+)\.backblazeb2\.com/);
        if (match) {
          region = match[1];
        }
      }

      s3Client = new S3Client({
        region: region,
        endpoint: endpoint,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
      console.log(`⚡ Cloud S3-compatible Storage initialized with region: ${region}`);
      return true;
    } catch (err) {
      console.error("❌ Failed to load Cloud S3-compatible AWS SDK:", err.message);
      return false;
    }
  }
  return false;
}

// Ensure local uploads directory exists
const UPLOADS_DIR = path.join(__dirname, "../uploads");
const categories = ["photo", "video", "sticker", "thumbnail"];
categories.forEach(cat => {
  const dir = path.join(UPLOADS_DIR, cat);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Helper: Upload file using appropriate storage driver
async function uploadFile(fileBuffer, originalName, mimeType, category) {
  const fileExt = path.extname(originalName) || getExtFromMime(mimeType);
  const randomName = `${uuidv4()}${fileExt}`;
  const key = `${category}/${randomName}`;

  // Attempt S3/R2 initialization first
  if (!s3Client) {
    initR2();
  }

  if (s3Client) {
    try {
      const { PutObjectCommand } = require("@aws-sdk/client-s3");
      await s3Client.send(
        new PutObjectCommand({
          Bucket: R2_BUCKET,
          Key: key,
          Body: fileBuffer,
          ContentType: mimeType,
        })
      );
      
      const isS3 = !!process.env.S3_ENDPOINT;
      return { fileUrl: key, storageType: isS3 ? "s3" : "r2", key };
    } catch (err) {
      console.error("⚠️ Cloud upload failed, falling back to local file system:", err.message);
    }
  }

  // Local file system upload
  const destDir = path.join(UPLOADS_DIR, category);
  const destPath = path.join(destDir, randomName);
  
  fs.writeFileSync(destPath, fileBuffer);
  
  // Return relative path url (will be prepended with server host in Express)
  const fileUrl = `/uploads/${category}/${randomName}`;
  return { fileUrl, storageType: "local", key: `/uploads/${category}/${randomName}` };
}

// Helper: Get a presigned GET URL for S3/R2 cloud assets
async function getPresignedUrl(key) {
  if (!key || key.startsWith("/uploads/")) {
    return key;
  }

  if (!s3Client) {
    initR2();
  }

  if (!s3Client) {
    return key;
  }

  try {
    const { GetObjectCommand } = require("@aws-sdk/client-s3");
    const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

    const command = new GetObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
    });

    // URL is signed and valid for 24 hours (86400 seconds)
    return await getSignedUrl(s3Client, command, { expiresIn: 86400 });
  } catch (err) {
    console.error("❌ Failed to generate presigned URL:", err.message);
    return key;
  }
}

// Helper: Delete file
async function deleteFile(fileUrl, storageType, key) {
  if ((storageType === "r2" || storageType === "s3") && s3Client) {
    try {
      const { DeleteObjectCommand } = require("@aws-sdk/client-s3");
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: R2_BUCKET,
          Key: key,
        })
      );
      return true;
    } catch (err) {
      console.error("❌ Cloud delete failed:", err.message);
      return false;
    }
  }

  // Delete local file
  try {
    const localPath = path.join(__dirname, "..", key);
    if (fs.existsSync(localPath)) {
      fs.unlinkSync(localPath);
      return true;
    }
  } catch (err) {
    console.error("❌ Local file delete failed:", err.message);
  }
  return false;
}

// Utility: Mime type mapper
function getExtFromMime(mimeType) {
  switch (mimeType) {
    case "image/jpeg": return ".jpg";
    case "image/png": return ".png";
    case "image/gif": return ".gif";
    case "image/webp": return ".webp";
    case "video/mp4": return ".mp4";
    case "video/quicktime": return ".mov";
    case "video/webm": return ".webm";
    case "application/zip": return ".zip";
    default: return "";
  }
}

// Initialize immediately on startup to verify configuration
initR2();

module.exports = {
  uploadFile,
  deleteFile,
  getPresignedUrl,
};
