const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

// JSON DB Fallback Config
const JSON_DB_PATH = path.join(__dirname, "../database_store.json");

// Helper to read JSON DB
function readJsonDb() {
  if (!fs.existsSync(JSON_DB_PATH)) {
    const initialData = { users: [], media: [], collections: [], comments: [] };
    fs.writeFileSync(JSON_DB_PATH, JSON.stringify(initialData, null, 2), "utf8");
    return initialData;
  }
  try {
    return JSON.parse(fs.readFileSync(JSON_DB_PATH, "utf8"));
  } catch (err) {
    console.error("Error reading JSON Database, resetting...", err);
    return { users: [], media: [], collections: [], comments: [] };
  }
}

// Helper to write JSON DB
function writeJsonDb(data) {
  fs.writeFileSync(JSON_DB_PATH, JSON.stringify(data, null, 2), "utf8");
}

let isMongoConnected = false;

// Connect to MongoDB if URI exists
async function connectDb() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.log("⚠️ No MONGODB_URI found in env. Running with JSON File DB Fallback.");
    return false;
  }
  try {
    await mongoose.connect(mongoUri);
    isMongoConnected = true;
    console.log("⚡ MongoDB connected successfully.");
    return true;
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    console.log("⚠️ Falling back to JSON File DB.");
    return false;
  }
}

// ── MONGOOSE SCHEMA DEFINITIONS ───────────────────────────────────────────
const UserSchema = new mongoose.Schema({
  inviteToken: { type: String, unique: true },
  passwordHash: { type: String, required: true },
  mustChangePassword: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

const MediaSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  fileName: { type: String, required: true },
  fileUrl: { type: String, required: true },
  thumbnailUrl: { type: String },
  mediaType: { type: String, enum: ["photo", "video", "sticker"], required: true },
  title: { type: String, default: "" },
  story: { type: String, default: "" },
  tags: { type: [String], default: [] },
  mediaDate: { type: Date, default: Date.now },
  uploadedAt: { type: Date, default: Date.now },
  favorite: { type: Boolean, default: false },
  views: { type: Number, default: 0 },
  collectionId: { type: String, default: null },
  relationships: { type: [String], default: [] },
  storageType: { type: String, enum: ["local", "r2", "s3"], default: "local" }
});

const CollectionSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String, default: "" },
  coverMediaUrl: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now }
});

const CommentSchema = new mongoose.Schema({
  mediaId: { type: String, required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const MongoModels = {
  User: mongoose.models.User || mongoose.model("User", UserSchema),
  Media: mongoose.models.Media || mongoose.model("Media", MediaSchema),
  Collection: mongoose.models.Collection || mongoose.model("Collection", CollectionSchema),
  Comment: mongoose.models.Comment || mongoose.model("Comment", CommentSchema),
};

// ── JSON FILE FALLBACK IMPLEMENTATION ────────────────────────────────────
class FileModel {
  constructor(collectionName) {
    this.collectionName = collectionName;
  }

  async find(query = {}) {
    const data = readJsonDb();
    let list = data[this.collectionName] || [];
    
    // Apply key-value filtering
    return list.filter(item => {
      for (let key in query) {
        if (query[key] !== undefined && item[key] !== query[key]) {
          return false;
        }
      }
      return true;
    }).map(item => ({ ...item, id: item._id }));
  }

  async findOne(query = {}) {
    const results = await this.find(query);
    return results[0] || null;
  }

  async findById(id) {
    return this.findOne({ _id: id });
  }

  async create(doc) {
    const data = readJsonDb();
    const newDoc = {
      _id: uuidv4(),
      createdAt: new Date().toISOString(),
      ...doc,
    };
    if (newDoc.uploadedAt === undefined) newDoc.uploadedAt = new Date().toISOString();
    if (newDoc.mediaDate === undefined) newDoc.mediaDate = new Date().toISOString();

    data[this.collectionName].push(newDoc);
    writeJsonDb(data);
    return { ...newDoc, id: newDoc._id };
  }

  async findByIdAndUpdate(id, update, options = {}) {
    const data = readJsonDb();
    const list = data[this.collectionName] || [];
    const index = list.findIndex(item => item._id === id);
    if (index === -1) return null;

    let updatedDoc = { ...list[index] };
    
    // Handle mongoose-style updates ($set or flat updates)
    const setFields = update.$set || update;
    for (let key in setFields) {
      updatedDoc[key] = setFields[key];
    }
    
    // Support increment like $inc
    if (update.$inc) {
      for (let key in update.$inc) {
        updatedDoc[key] = (updatedDoc[key] || 0) + update.$inc[key];
      }
    }

    list[index] = updatedDoc;
    data[this.collectionName] = list;
    writeJsonDb(data);
    return { ...updatedDoc, id: updatedDoc._id };
  }

  async deleteOne(query = {}) {
    const data = readJsonDb();
    let list = data[this.collectionName] || [];
    
    const index = list.findIndex(item => {
      for (let key in query) {
        if (item[key] !== query[key]) return false;
      }
      return true;
    });

    if (index === -1) return { deletedCount: 0 };
    list.splice(index, 1);
    data[this.collectionName] = list;
    writeJsonDb(data);
    return { deletedCount: 1 };
  }

  async deleteMany(query = {}) {
    const data = readJsonDb();
    let list = data[this.collectionName] || [];
    const originalLength = list.length;
    
    list = list.filter(item => {
      for (let key in query) {
        if (item[key] === query[key]) return false;
      }
      return true;
    });

    data[this.collectionName] = list;
    writeJsonDb(data);
    return { deletedCount: originalLength - list.length };
  }
}

const FileModels = {
  User: new FileModel("users"),
  Media: new FileModel("media"),
  Collection: new FileModel("collections"),
  Comment: new FileModel("comments"),
};

// Unified interface accessor
const db = {
  get User() {
    return isMongoConnected ? MongoModels.User : FileModels.User;
  },
  get Media() {
    return isMongoConnected ? MongoModels.Media : FileModels.Media;
  },
  get Collection() {
    return isMongoConnected ? MongoModels.Collection : FileModels.Collection;
  },
  get Comment() {
    return isMongoConnected ? MongoModels.Comment : FileModels.Comment;
  },
  connectDb,
  isMongoConnected: () => isMongoConnected,
};

module.exports = db;
