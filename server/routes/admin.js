const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const db = require("../services/db");
const { verifyAdminSecret } = require("../middleware/auth");

// Utility to generate a random clean invite token
function generateInviteToken(length = 6) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < length; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// 1. Create a new user with invite link & default password
router.post("/users", verifyAdminSecret, async (req, res) => {
  const { defaultPassword = "modi_modi" } = req.body;

  try {
    // Generate a unique invite token
    let inviteToken = generateInviteToken(6);
    let attempts = 0;
    while (attempts < 10) {
      const existing = await db.User.findOne({ inviteToken });
      if (!existing) break;
      inviteToken = generateInviteToken(6);
      attempts++;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(defaultPassword, salt);

    const newUser = await db.User.create({
      inviteToken,
      passwordHash,
      mustChangePassword: true,
    });

    const host = req.get("host");
    const protocol = req.protocol;
    // Assemble mock invite link
    const inviteUrl = `${protocol}://${host}/u/${inviteToken}`;

    return res.json({
      message: "User invite created successfully.",
      user: {
        id: newUser._id || newUser.id,
        inviteToken: newUser.inviteToken,
        defaultPassword,
        inviteUrl,
        createdAt: newUser.createdAt,
      },
    });
  } catch (err) {
    console.error("Admin user creation error:", err);
    return res.status(500).json({ error: "Failed to create user invite." });
  }
});

// 2. Fetch all users to display links in admin panel
router.get("/users", async (req, res) => {
  try {
    const users = await db.User.find({});
    const formatted = users.map(u => ({
      id: u._id || u.id,
      inviteToken: u.inviteToken,
      mustChangePassword: u.mustChangePassword,
      createdAt: u.createdAt,
    }));
    return res.json(formatted);
  } catch (err) {
    console.error("Admin list users error:", err);
    return res.status(500).json({ error: "Failed to retrieve user invites." });
  }
});

// 3. Verify a user's current password
router.post("/users/verify", async (req, res) => {
  const { userId, currentPassword } = req.body;

  if (!userId || !currentPassword) {
    return res.status(400).json({ error: "User ID and current password are required." });
  }

  try {
    const user = await db.User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: "Incorrect current password." });
    }

    return res.json({ success: true, message: "Password verified successfully." });
  } catch (err) {
    console.error("Verify user password error:", err);
    return res.status(500).json({ error: "Failed to verify password." });
  }
});

// 4. Reset a user's password and flag it for mandatory change (or directly change it)
router.post("/users/reset", async (req, res) => {
  const { userId, currentPassword, newPassword, defaultPassword = "modi_modi", mustChangePassword } = req.body;

  if (!userId || !currentPassword) {
    return res.status(400).json({ error: "User ID and current password are required." });
  }

  try {
    const user = await db.User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // Verify current password first
    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: "Incorrect current password." });
    }

    const passwordToHash = newPassword || defaultPassword;
    const isMandatoryChange = mustChangePassword !== undefined ? mustChangePassword : (newPassword ? false : true);

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(passwordToHash, salt);

    await db.User.findByIdAndUpdate(userId, {
      $set: {
        passwordHash,
        mustChangePassword: isMandatoryChange,
      },
    });

    return res.json({
      message: isMandatoryChange ? "Password reset and mustChangePassword enabled." : "Password changed successfully.",
      password: passwordToHash,
    });
  } catch (err) {
    console.error("Admin reset user error:", err);
    return res.status(500).json({ error: "Failed to update password." });
  }
});

module.exports = router;
