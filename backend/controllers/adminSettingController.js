const {
  getAdminSettings,
  updateAdminSettings,
} = require("../models/adminSettingModel");

// ==========================================
// GET SETTINGS
// ==========================================

const getSettings = async (req, res) => {
  try {
    const settings = await getAdminSettings();

    if (!settings) {
      return res.status(404).json({
        success: false,
        message: "Admin settings not found",
      });
    }

    return res.json({
      success: true,
      settings,
    });

  } catch (error) {
    console.error("Get settings error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch settings",
    });
  }
};

// ==========================================
// UPDATE SETTINGS
// ==========================================

const updateSettings = async (req, res) => {
  try {
    const whatsappNumber = String(
      req.body.whatsappNumber || ""
    ).trim();

    const loginHeading = String(
      req.body.loginHeading || ""
    ).trim();

    const loginDescription = String(
      req.body.loginDescription || ""
    ).trim();

    // Validate WhatsApp number
    if (!/^\d{10,15}$/.test(whatsappNumber)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid WhatsApp number with country code",
      });
    }

    // Validate login page content
    if (!loginHeading || loginHeading.length > 500) {
      return res.status(400).json({
        success: false,
        message: "Login heading is required and must be within 500 characters",
      });
    }

    if (!loginDescription || loginDescription.length > 1500) {
      return res.status(400).json({
        success: false,
        message: "Login description is required and must be within 1500 characters",
      });
    }

    // Read images from upload.fields()
    const qrImagePath = req.files?.qrImage?.[0]
      ? `/uploads/${req.files.qrImage[0].filename}`
      : null;

    const logoImagePath = req.files?.logoImage?.[0]
      ? `/uploads/${req.files.logoImage[0].filename}`
      : null;

    // Update settings
    const settings = await updateAdminSettings({
      whatsappNumber,
      qrImagePath,
      logoImagePath,
      loginHeading,
      loginDescription,
    });

    return res.json({
      success: true,
      message: "Admin settings updated successfully",
      settings,
    });

  } catch (error) {
    console.error("Update settings error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update settings",
    });
  }
};

module.exports = {
  getSettings,
  updateSettings,
};