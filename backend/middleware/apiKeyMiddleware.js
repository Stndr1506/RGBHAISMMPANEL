
const crypto = require("crypto");
const apiKeyModel = require("../models/apiKeyModel");

// =====================================================
// RGBHAI EXTERNAL API KEY AUTHENTICATION
// =====================================================

const apiKeyMiddleware = async (req, res, next) => {
  try {
    // API key can be supplied in the request body
    // or through the optional X-API-Key header.
    const providedKey =
      req.body?.key || req.headers["x-api-key"];

    if (
      typeof providedKey !== "string" ||
      !providedKey.trim()
    ) {
      return res.status(401).json({
        error: "API key is required",
      });
    }

    const apiKey = providedKey.trim();

    // Validate RGBHAI API key format.
    if (!/^rgb_live_[a-f0-9]{64}$/i.test(apiKey)) {
      return res.status(401).json({
        error: "Invalid API key",
      });
    }

    // Generate SHA-256 hash.
    const keyHash = crypto
      .createHash("sha256")
      .update(apiKey, "utf8")
      .digest("hex");

    // Find active API key in SQL Server.
    const apiKeyRecord =
      await apiKeyModel.findActiveApiKeyByHash(keyHash);

    if (!apiKeyRecord) {
      return res.status(401).json({
        error: "Invalid or revoked API key",
      });
    }

    // Check current user account status.
    if (
      String(apiKeyRecord.account_status || "").toLowerCase() ===
      "discontinued"
    ) {
      return res.status(403).json({
        error: "Your RGBHAI account has been discontinued",
      });
    }

    // Attach authenticated reseller information.
    req.apiUser = {
      id: Number(apiKeyRecord.user_id),
      username: apiKeyRecord.username,
      email: apiKeyRecord.email,
      role: apiKeyRecord.role,
    };

    req.apiKey = {
      id: apiKeyRecord.api_key_id,
      name: apiKeyRecord.key_name,
    };

    // Update last API key usage.
    await apiKeyModel.updateApiKeyLastUsed(
      apiKeyRecord.api_key_id
    );

    return next();

  } catch (error) {
    console.error("API KEY AUTHENTICATION ERROR:", error);

    return res.status(500).json({
      error: "API authentication service unavailable",
    });
  }
};

module.exports = apiKeyMiddleware;
