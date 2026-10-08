const express = require("express");

const router = express.Router();

const {
  getAllAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement
} = require("../controllers/adminAnnouncementController");

// GET all
router.get("/", getAllAnnouncements);

// GET single
router.get("/:id", getAnnouncementById);

// CREATE
router.post("/", createAnnouncement);

// UPDATE
router.put("/:id", updateAnnouncement);

// DELETE
router.delete("/:id", deleteAnnouncement);

module.exports = router;