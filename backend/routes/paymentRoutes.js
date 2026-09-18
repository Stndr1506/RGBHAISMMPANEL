const express = require("express");

const {
  createDeposit,
  verifyPaytmPayment
} = require("../controllers/paymentController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
  "/create",
  authMiddleware,
  createDeposit
);

router.post(
  "/paytm/verify",
  authMiddleware,
  verifyPaytmPayment
);
module.exports = router;
