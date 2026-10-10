const {
  getAllOrders,
} = require("../models/adminOrderModel");

const { sql, getDB } = require("../config/db");

// Allowed order statuses
const ALLOWED_STATUSES = [
  "Pending",
  "In progress",
  "Processing",
  "Completed",
  "Partial",
  "Canceled",
];

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
    console.error("Admin orders controller error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch orders",
      error: error.message,
    });
  }
};

// =====================================================
// UPDATE ORDER STATUS - ADMIN
// =====================================================

const updateOrderStatus = async (req, res) => {
  try {
    const orderId = Number(req.params.id);
    const { status } = req.body;

    // Validate order ID
    if (!Number.isInteger(orderId) || orderId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID.",
      });
    }

    // Validate status
    const normalizedStatus = String(status || "").trim();

    const validStatus = ALLOWED_STATUSES.find(
      (item) =>
        item.toLowerCase() === normalizedStatus.toLowerCase()
    );

    if (!validStatus) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status.",
        allowedStatuses: ALLOWED_STATUSES,
      });
    }

    // Connect to SQL Server
    const pool = await getDB();

    // Update order status
    const result = await pool
      .request()
      .input("id", sql.Int, orderId)
      .input("status", sql.VarChar(30), validStatus)
      .query(`
        UPDATE orders
        SET
          status = @status,
          updated_at = GETDATE()
        OUTPUT
          INSERTED.id,
          INSERTED.status
        WHERE id = @id
      `);

    // Check whether the order exists
    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Order status updated successfully.",
      order: result.recordset[0],
    });
  } catch (error) {
    console.error("Update order status error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update order status.",
    });
  }
};

module.exports = {
  getAdminOrders,
  updateOrderStatus,
};