const {
  getAllUsers,
  getUserByIdAdmin,
  updateUserStatus
} = require("../models/adminUserModel");



// =====================================================
// GET ALL USERS
// =====================================================

const getAdminUsers = async (req, res) => {

  try {
    console.log("Fetching users from SQL Server...");

    const users = await getAllUsers();

    return res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  

  } catch (error) {

    console.error(
      "Get admin users error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to fetch users",
    });

  }
};


// =====================================================
// GET SINGLE USER
// =====================================================

const getAdminUserById = async (req, res) => {

  try {

    const userId = Number(req.params.id);

    if (!Number.isInteger(userId) || userId <= 0) {

      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });

    }


    const user =
      await getUserByIdAdmin(userId);


    if (!user) {

      return res.status(404).json({
        success: false,
        message: "User not found",
      });

    }


    return res.status(200).json({
      success: true,
      user,
    });

  } catch (error) {

    console.error(
      "Get admin user error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to fetch user",
    });

  }
};


const changeUserStatus = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID.",
      });
    }

    if (!["Active", "Discontinued"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid account status.",
      });
    }

    // Prevent accidentally discontinuing your own admin account.
    if (
      Number(req.user?.id) === id &&
      status === "Discontinued"
    ) {
      return res.status(400).json({
        success: false,
        message: "You cannot discontinue your own account.",
      });
    }

    const user = await updateUserStatus(id, status);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: `User account ${status.toLowerCase()} successfully.`,
      user,
    });
  } catch (error) {
    console.error("Change user status error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update user status.",
    });
  }
};


module.exports = {
  getAdminUsers,
  getAdminUserById,
  changeUserStatus
};