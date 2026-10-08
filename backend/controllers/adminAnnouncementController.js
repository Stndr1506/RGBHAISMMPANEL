const announcementModel = require("../models/announcementModel");

// =====================================================
// GET ALL ANNOUNCEMENTS
// =====================================================

const getAllAnnouncements = async (req, res) => {
  try {

    const announcements =
      await announcementModel.getAllAnnouncements();

    res.status(200).json({
      success: true,
      announcements
    });

  } catch (error) {

    console.error(
      "Get all announcements error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch announcements"
    });
  }
};


// =====================================================
// GET SINGLE ANNOUNCEMENT
// =====================================================

const getAnnouncementById = async (req, res) => {
  try {

    const { id } = req.params;

    const announcement =
      await announcementModel.getAnnouncementById(id);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: "Announcement not found"
      });
    }

    res.status(200).json({
      success: true,
      announcement
    });

  } catch (error) {

    console.error(
      "Get announcement error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch announcement"
    });
  }
};


// =====================================================
// CREATE ANNOUNCEMENT
// =====================================================

const createAnnouncement = async (req, res) => {
  try {

    const {
      title,
      type,
      message,
      service_id,
      status
    } = req.body;

    // Validation
    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: "Title and message are required"
      });
    }

    const announcement =
      await announcementModel.createAnnouncement({
        title,
        type: type || "GENERAL",
        message,
        service_id: service_id || null,
        status: status || "published"
      });

    res.status(201).json({
      success: true,
      message: "Announcement created successfully",
      announcement
    });

  } catch (error) {

    console.error(
      "Create announcement error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to create announcement"
    });
  }
};


// =====================================================
// UPDATE ANNOUNCEMENT
// =====================================================

const updateAnnouncement = async (req, res) => {
  try {

    const { id } = req.params;

    const {
      title,
      type,
      message,
      service_id,
      status
    } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: "Title and message are required"
      });
    }

    const affectedRows =
      await announcementModel.updateAnnouncement(
        id,
        {
          title,
          type: type || "GENERAL",
          message,
          service_id: service_id || null,
          status: status || "published"
        }
      );

    if (!affectedRows) {
      return res.status(404).json({
        success: false,
        message: "Announcement not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Announcement updated successfully"
    });

  } catch (error) {

    console.error(
      "Update announcement error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to update announcement"
    });
  }
};


// =====================================================
// DELETE ANNOUNCEMENT
// =====================================================

const deleteAnnouncement = async (req, res) => {
  try {

    const { id } = req.params;

    const affectedRows =
      await announcementModel.deleteAnnouncement(id);

    if (!affectedRows) {
      return res.status(404).json({
        success: false,
        message: "Announcement not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Announcement deleted successfully"
    });

  } catch (error) {

    console.error(
      "Delete announcement error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to delete announcement"
    });
  }
};


module.exports = {
  getAllAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement
};