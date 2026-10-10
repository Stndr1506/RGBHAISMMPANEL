
const { getOrdersByUserId } = require("../models/userOrderModel");

// ============================================
// GET LOGGED-IN USER'S ORDERS
// GET /api/orders
// ============================================

const getUserOrders = async (req, res) => {
  try {
    // User ID must come from the verified JWT.
    const userId = req.user?.id ?? req.user?.userId;

    if (!userId || !Number.isInteger(Number(userId))) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Please log in again.",
      });
    }

    const orders = await getOrdersByUserId(Number(userId));

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error("Get user orders error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch orders.",
    });
  }
};

module.exports = {
  getUserOrders,
};