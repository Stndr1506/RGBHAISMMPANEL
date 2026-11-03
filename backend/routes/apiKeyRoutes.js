
const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
  generateApiKey,
  getMyApiKeys,
  revokeMyApiKey,
} = require("../controllers/apiKeyController");

// All routes require a valid RGBHAI JWT.
router.use(authMiddleware);

// Generate a new API key
router.post("/", generateApiKey);

// Get logged-in user's API keys
router.get("/", getMyApiKeys);

// Revoke an API key owned by the logged-in user
router.delete("/:id", revokeMyApiKey);

module.exports = router;
