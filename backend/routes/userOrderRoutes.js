const express = require("express");
const router = express.Router();

const { getUserOrders } = require("../controllers/userOrderController");
const authMiddleware = require("../middleware/authMiddleware");



router.get("/", authMiddleware, getUserOrders);

module.exports = router;