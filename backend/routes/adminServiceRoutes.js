
const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const {
  getServices,
  getService,
  createService,
  updateService,
  deleteService,
  createBulkServices,
  reorderServices,
} = require("../controllers/adminServiceController");

// GET all services
router.get(
  "/",
  authMiddleware,
  adminMiddleware,
  getServices
);

// IMPORTANT: Register /bulk before /:id
router.post(
  "/bulk",
  authMiddleware,
  adminMiddleware,
  createBulkServices
);

// GET one service
router.get(
  "/:id",
  authMiddleware,
  adminMiddleware,
  getService
);

// CREATE one service
router.post(
  "/",
  authMiddleware,
  adminMiddleware,
  createService
);

// REORDER SERVICES
router.put(
  "/reorder",
  authMiddleware,
  adminMiddleware,
  reorderServices
);

// UPDATE service
router.put(
  "/:id",
  authMiddleware,
  adminMiddleware,
  updateService
);

// DELETE service
router.delete(
  "/:id",
  authMiddleware,
  adminMiddleware,
  deleteService
);

module.exports = router;
