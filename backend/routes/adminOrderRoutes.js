const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const {
  getAdminOrders,
} = require("../controllers/adminOrderController");

// =====================================================
// GET ALL ORDERS
// =====================================================

router.get(
  "/orders",
  authMiddleware,
    adminMiddleware,
  
  getAdminOrders
);

module.exports = router;