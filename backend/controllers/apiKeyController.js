
const crypto = require("crypto");
const apiKeyModel = require("../models/apiKeyModel");

// =====================================================
// GET AUTHENTICATED USER ID
// =====================================================

const getAuthenticatedUserId = (req) => {
  const userId = Number(req.user?.id ?? req.user?.userId);

  return Number.isInteger(userId) && userId > 0
    ? userId
    : null;
};

// =====================================================
// GENERATE API KEY
// POST /api/api-keys
// =====================================================

const generateApiKey = async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const name =
      typeof req.body?.name === "string"
        ? req.body.name.trim()
        : "";

    if (name.length > 100) {
      return res.status(400).json({
        success: false,
        message: "API key name cannot exceed 100 characters.",
      });
    }

    // Generate a cryptographically secure random key.
    const secret = crypto.randomBytes(32).toString("hex");

    const apiKey = `rgb_live_${secret}`;

    // Store only the SHA-256 hash.
    const keyHash = crypto
      .createHash("sha256")
      .update(apiKey, "utf8")
      .digest("hex");

    // Store a short prefix for identification.
    const keyPrefix = apiKey.substring(0, 17);

    const savedKey = await apiKeyModel.createApiKey({
      userId,
      keyHash,
      keyPrefix,
      name: name || "Default API Key",
    });

    return res.status(201).json({
      success: true,
      message: "API key generated successfully.",
      apiKey, // Display this secret only once.
      key: savedKey,
      warning: "Copy and securely save your API key. It cannot be retrieved again.",
    });

  } catch (error) {
    console.error("GENERATE API KEY ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to generate API key.",
    });
  }
};

// =====================================================
// GET USER API KEYS
// GET /api/api-keys
// =====================================================

const getMyApiKeys = async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const keys = await apiKeyModel.getApiKeysByUserId(userId);

    return res.status(200).json({
      success: true,
      count: keys.length,
      keys,
    });

  } catch (error) {
    console.error("GET API KEYS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch API keys.",
    });
  }
};

// =====================================================
// REVOKE API KEY
// DELETE /api/api-keys/:id
// =====================================================

const revokeMyApiKey = async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const apiKeyId = Number(req.params.id);

    if (!Number.isInteger(apiKeyId) || apiKeyId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid API key ID.",
      });
    }

    const revoked = await apiKeyModel.revokeApiKey(
      apiKeyId,
      userId
    );

    if (!revoked) {
      return res.status(404).json({
        success: false,
        message: "API key not found or already revoked.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "API key revoked successfully.",
    });

  } catch (error) {
    console.error("REVOKE API KEY ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to revoke API key.",
    });
  }
};

module.exports = {
  generateApiKey,
  getMyApiKeys,
  revokeMyApiKey,
};
