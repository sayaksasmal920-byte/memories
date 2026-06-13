const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../services/db");
const { verifyUserToken, JWT_SECRET } = require("../middleware/auth");

// 1. First-time or regular login using invite token + password
router.post("/login", async (req, res) => {
  const { inviteToken, password } = req.body;

  if (!inviteToken || !password) {
    return res.status(400).json({ error: "Invite token and password are required." });
  }

  try {
    const user = await db.User.findOne({ inviteToken });
    if (!user) {
      return res.status(401).json({ error: "Invalid invite token. Please check your URL." });
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid password." });
    }

    const token = jwt.sign({ id: user._id || user.id }, JWT_SECRET, { expiresIn: "30d" });

    return res.json({
      token,
      mustChangePassword: user.mustChangePassword,
      userId: user._id || user.id,
      inviteToken: user.inviteToken,
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Internal server error during login." });
  }
});

// 2. Change password (required for mustChangePassword)
router.post("/change-password", verifyUserToken, async (req, res) => {
  const { password } = req.body;

  if (!password || password.trim().length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters long." });
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    await db.User.findByIdAndUpdate(req.user._id || req.user.id, {
      $set: {
        passwordHash,
        mustChangePassword: false,
      },
    });

    return res.json({ message: "Password updated successfully." });
  } catch (err) {
    console.error("Change password error:", err);
    return res.status(500).json({ error: "Failed to update password." });
  }
});

// 3. Get current session info
router.get("/me", verifyUserToken, async (req, res) => {
  return res.json({
    userId: req.user._id || req.user.id,
    inviteToken: req.user.inviteToken,
    mustChangePassword: req.user.mustChangePassword,
    createdAt: req.user.createdAt,
  });
});

module.exports = router;
