
const {
  getAllOrders,
} = require("../models/adminOrderModel");

const { sql, getDB } = require("../config/db");

const ALLOWED_STATUSES = [
  "Pending",
  "In progress",
  "Processing",
  "Completed",
  "Partial",
  "Canceled",
];

// GET ALL ORDERS - ADMIN
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
      message: "Unable to fetch orders.",
    });
  }
};

// UPDATE ORDER STATUS - ADMIN
const updateOrderStatus = async (req, res) => {
  try {
    const orderId = Number(req.params.id);
    const { status } = req.body;

    if (!Number.isSafeInteger(orderId) || orderId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID.",
      });
    }

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

    const pool = await getDB();

    const result = await pool
      .request()
      .input("id", sql.Int, orderId)
      .input("status", sql.VarChar(30), validStatus)
      .query(`
        UPDATE dbo.orders
        SET
          status = @status,
          updated_at = GETDATE()
        OUTPUT
          INSERTED.id,
          INSERTED.status,
          INSERTED.updated_at
        WHERE id = @id;
      `);

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

// UPDATE START COUNT - ADMIN
const updateStartCount = async (req, res) => {
  try {
    const orderId = Number(req.params.id);
    const startCount = req.body?.start_count;

    if (!Number.isSafeInteger(orderId) || orderId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID.",
      });
    }

    if (
      startCount === null ||
      startCount === undefined ||
      startCount === "" ||
      !Number.isSafeInteger(Number(startCount)) ||
      Number(startCount) < 0 ||
      Number(startCount) > 2147483647
    ) {
      return res.status(400).json({
        success: false,
        message: "Start count must be a non-negative whole number.",
      });
    }

    const pool = await getDB();

    const result = await pool
      .request()
      .input("id", sql.Int, orderId)
      .input("start_count", sql.Int, Number(startCount))
      .query(`
        UPDATE dbo.orders
        SET
          start_count = @start_count,
          updated_at = GETDATE()
        OUTPUT
          INSERTED.id,
          INSERTED.start_count,
          INSERTED.updated_at
        WHERE id = @id;
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Start count updated successfully.",
      order: result.recordset[0],
    });
  } catch (error) {
    console.error("Update start count error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update start count.",
    });
  }
};

module.exports = {
  getAdminOrders,
  updateOrderStatus,
  updateStartCount,
};
