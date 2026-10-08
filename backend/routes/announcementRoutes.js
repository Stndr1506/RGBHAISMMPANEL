const express = require("express");

const router = express.Router();

const {
  getPublishedAnnouncements
} = require("../controllers/announcementController");

// Only published announcements
router.get("/", getPublishedAnnouncements);

module.exports = router;