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
} = require("../controllers/adminServiceController");

// GET all services
router.get("/", 
  authMiddleware,
  adminMiddleware,
  getServices);

// GET one service
router.get("/:id", 
  authMiddleware,
  adminMiddleware,
  getService);

// CREATE service
router.post("/", 
  authMiddleware,
  adminMiddleware,
  createService);

// UPDATE service
router.put("/:id", 
  authMiddleware,
  adminMiddleware,
  updateService);

// DELETE service
router.delete("/:id", 
  authMiddleware,
  adminMiddleware,
  deleteService);

module.exports = router;
