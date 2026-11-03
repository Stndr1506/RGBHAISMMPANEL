
const express = require("express");
const router = express.Router();

const apiKeyMiddleware = require("../middleware/apiKeyMiddleware");

const {
  handleApiRequest,
} = require("../controllers/apiController");

// All external API v2 requests require an RGBHAI API key.
router.post(
  "/",
  apiKeyMiddleware,
  handleApiRequest
);

module.exports = router;
