const express = require("express");

const router = express.Router();

const {
  createPaytmPayment,
} = require("../controllers/paytmController");

const authMiddleware = require("../middleware/authMiddleware");

router.post(
  "/create",
  authMiddleware,
  createPaytmPayment
);



module.exports = router;