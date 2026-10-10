const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const {
  getAdminOrders,
  updateOrderStatus,
} = require("../controllers/adminOrderController");

// GET ALL ORDERS
router.get(
  "/orders",
  authMiddleware,
  adminMiddleware,
  getAdminOrders
);

// UPDATE ORDER STATUS
router.patch(
  "/orders/:id/status",
  authMiddleware,
  adminMiddleware,
  updateOrderStatus
);

module.exports = router;