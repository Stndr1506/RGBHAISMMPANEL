const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const {
  getAdminUsers,
  getAdminUserById,
  changeUserStatus
} = require("../controllers/adminUserController");

const {
  updateUserFunds,
} = require("../controllers/adminWalletController");


// =====================================================
// GET ALL USERS
// GET /api/admin/users
// =====================================================

router.get(
  "/",
  authMiddleware,
  adminMiddleware,
  getAdminUsers
);


// =====================================================
// GET SINGLE USER
// GET /api/admin/users/:id
// =====================================================

router.get(
  "/:id",
  authMiddleware,
  adminMiddleware,
  getAdminUserById
);


router.patch(
  "/:id/status",
  authMiddleware,
  adminMiddleware,
  changeUserStatus
);

// =====================================================
// ADMIN UPDATE USER FUNDS
// POST /api/admin/users/:id/funds
// =====================================================

router.post(
  "/:id/funds",
  authMiddleware,
  adminMiddleware,
  updateUserFunds
);


module.exports = router;