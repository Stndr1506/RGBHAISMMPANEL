const express = require("express");

const router = express.Router();

const authMiddleware =
  require("../middleware/authMiddleware");

const {
  placeOrder,
  getMyOrders,
  getMyOrderById,
} = require("../controllers/orderController");


// =====================================================
// CREATE ORDER
// POST /api/orders
// =====================================================

router.post(
  "/",
  authMiddleware,
  placeOrder
);


// =====================================================
// GET MY ORDERS
// GET /api/orders
// =====================================================

router.get(
  "/",
  authMiddleware,
  getMyOrders
);


// =====================================================
// GET SINGLE ORDER
// GET /api/orders/:id
// =====================================================

router.get(
  "/:id",
  authMiddleware,
  getMyOrderById
);


module.exports = router;