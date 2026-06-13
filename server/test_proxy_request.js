require("dotenv").config();
const jwt = require("jsonwebtoken");
const db = require("./services/db");
const { JWT_SECRET } = require("./middleware/auth");

async function run() {
  await db.connectDb();
  try {
    const users = await db.User.find({});
    if (users.length === 0) {
      console.log("No users found in DB.");
      return;
    }
    const user = users[0];
    const userId = user._id || user.id;

    // Sign a token
    const token = jwt.sign({ id: userId }, JWT_SECRET);

    // Query download-file route with local URL
    const localUrl = "http://localhost:5000/uploads/photo/1ceb9c68-0321-4d06-a427-e7afb5930f19.jpg";
    const downloadUrl = `http://localhost:5000/api/media/download-file?url=${encodeURIComponent(localUrl)}&name=${encodeURIComponent("local_batman")}`;
    console.log("Requesting proxy route for local URL:", downloadUrl);
    
    const response = await fetch(downloadUrl, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    console.log("Response status:", response.status);
    console.log("Response headers:", Object.fromEntries(response.headers.entries()));
    if (response.ok) {
      const buf = await response.arrayBuffer();
      console.log("Success! Received local file buffer length:", buf.byteLength);
    } else {
      const text = await response.text();
      console.log("Error response text:", text);
    }
  } catch (err) {
    console.error("Test request failed:", err);
  } finally {
    process.exit(0);
  }
}

run();
