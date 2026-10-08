const announcementModel = require("../models/announcementModel");

// =====================================================
// GET PUBLISHED ANNOUNCEMENTS
// =====================================================

const getPublishedAnnouncements = async (req, res) => {
  try {

    const announcements =
      await announcementModel.getPublishedAnnouncements();

    res.status(200).json({
      success: true,
      announcements
    });

  } catch (error) {

    console.error(
      "Get published announcements error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch announcements"
    });
  }
};

module.exports = {
  getPublishedAnnouncements
};