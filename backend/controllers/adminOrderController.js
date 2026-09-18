const {
  getAllOrders,
} = require("../models/adminOrderModel");

// =====================================================
// GET ALL ORDERS - ADMIN
// =====================================================

const getAdminOrders = async (req, res) => {
  try {

    const orders = await getAllOrders();

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });

  } catch (error) {

    console.error(
      "Admin orders controller error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to fetch orders",
      error: error.message,
    });
  }
};

module.exports = {
  getAdminOrders,
};