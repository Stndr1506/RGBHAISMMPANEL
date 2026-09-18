const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const {
  getAdminUsers,
  getAdminUserById,
} = require("../controllers/adminUserController");


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


module.exports = router;