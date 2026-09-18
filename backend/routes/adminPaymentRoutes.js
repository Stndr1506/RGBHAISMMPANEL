const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const {
  getPayments,
  getPaymentById
} = require("../controllers/adminPaymentController");


// Get all payments
router.get("/", 
  authMiddleware,
  adminMiddleware,
  getPayments);


// Get single payment
router.get("/:id", 
  authMiddleware,
  adminMiddleware,
  getPaymentById);


module.exports = router;