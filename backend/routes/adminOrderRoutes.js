
const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const {
  getAdminOrders,
  getAdminApiOrders,
  updateOrderStatus,
  updateStartCount,
  updateRemains,
} = require("../controllers/adminOrderController");

// GET ALL ORDERS
router.get(
  "/orders",
  authMiddleware,
  adminMiddleware,
  getAdminOrders
);

// GET API ORDERS
router.get(
  "/api-orders",
  authMiddleware,
  adminMiddleware,
  getAdminApiOrders
);

// UPDATE ORDER STATUS
router.patch(
  "/orders/:id/status",
  authMiddleware,
  adminMiddleware,
  updateOrderStatus
);

// UPDATE ORDER START COUNT
router.patch(
  "/orders/:id/start-count",
  authMiddleware,
  adminMiddleware,
  updateStartCount
);
// UPDATE ORDER REMAINING QUANTITY
router.patch(
  "/orders/:id/remains",
  authMiddleware,
  adminMiddleware,
  updateRemains
);



module.exports = router;
