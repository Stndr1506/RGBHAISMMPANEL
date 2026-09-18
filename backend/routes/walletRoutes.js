const express = require("express");


const authMiddleware = require("../middleware/authMiddleware");

const {
  getWallet,
} = require("../controllers/walletController");
const {
  getWalletBalance,
} = require("../controllers/walletController");



const router = express.Router();

router.get("/", authMiddleware, getWallet);
router.get("/balance", authMiddleware, getWalletBalance);

module.exports = router;
