
const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const {
  testConnection,
  saveProvider,
  getProviders,
  fetchProviderServices,
  disconnectProvider,
} = require("../controllers/providerController");

console.log("Provider route handler check:", {
  authMiddleware: typeof authMiddleware,
  adminMiddleware: typeof adminMiddleware,
  testConnection: typeof testConnection,
  saveProvider: typeof saveProvider,
  getProviders: typeof getProviders,
  fetchProviderServices: typeof fetchProviderServices,
  disconnectProvider: typeof disconnectProvider,
});

router.post(
  "/test",
  authMiddleware,
  adminMiddleware,
  testConnection,
);

router.post(
  "/",
  authMiddleware,
  adminMiddleware,
  saveProvider,
);

router.get(
  "/",
  authMiddleware,
  adminMiddleware,
  getProviders,
);

router.get(
  "/:providerId/services",
  authMiddleware,
  adminMiddleware,
  fetchProviderServices,
);

router.patch(
  "/:providerId/disconnect",
  authMiddleware,
  adminMiddleware,
  disconnectProvider,
);

module.exports = router;
