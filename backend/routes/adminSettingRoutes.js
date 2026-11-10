const express = require("express");
const router = express.Router();

const multer = require("multer");
const path = require("path");

const authMiddleware = require("../middleware/authMiddleware");

const {
  getSettings,
  updateSettings,
} = require("../controllers/adminSettingController");

// ===================================
// ADMIN ROLE CHECK
// ===================================

const adminOnly = (req, res, next) => {
  if (
    String(req.user?.role || "").toLowerCase() !== "admin"
  ) {
    return res.status(403).json({
      success: false,
      message: "Admin access required",
    });
  }

  next();
};

// ===================================
// QR IMAGE UPLOAD
// ===================================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads"));
  },

  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();

    cb(
      null,
      `payment-qr-${Date.now()}${extension}`
    );
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPG, PNG and WEBP images are allowed"));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

// ===================================
// ROUTES
// ===================================

// Fetch settings
router.get("/", getSettings);

// Update settings (admin only)
router.put(
  "/",
  authMiddleware,
  adminOnly,
  upload.fields([
  { name: "qrImage", maxCount: 1 },
  { name: "logoImage", maxCount: 1 }
]),
  updateSettings
);

module.exports = router;