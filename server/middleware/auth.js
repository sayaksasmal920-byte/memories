const jwt = require("jsonwebtoken");
const db = require("../services/db");

const JWT_SECRET = process.env.JWT_SECRET || "memoryvault-jwt-super-secret-key-12345";

// Verify user authentication token
async function verifyUserToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Access token required. Please log in." });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await db.User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: "User session expired or not found." });
    }
    
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired session token." });
  }
}

// Verify admin master secret
function verifyAdminSecret(req, res, next) {
  const adminSecret = req.headers["x-admin-secret"] || req.query.adminSecret;
  const configuredSecret = process.env.ADMIN_SECRET || "bum_diggy_diggy_bum_bum";

  if (!adminSecret || adminSecret !== configuredSecret) {
    return res.status(403).json({ error: "Forbidden: Invalid administrator secret credential." });
  }
  next();
}

module.exports = {
  verifyUserToken,
  verifyAdminSecret,
  JWT_SECRET,
};
