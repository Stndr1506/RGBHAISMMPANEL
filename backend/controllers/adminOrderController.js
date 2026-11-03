
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
          remains = CASE
            WHEN @status = 'Completed' THEN 0

            WHEN status = 'Completed'
                 AND @status IN (
                   'Pending',
                   'Processing',
                   'In progress'
                 )
              THEN quantity

            ELSE remains
          END,
          updated_at = GETDATE()
        OUTPUT
          INSERTED.id,
          INSERTED.status,
          INSERTED.quantity,
          INSERTED.remains,
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


// ============================================
// UPDATE REMAINING QUANTITY - ADMIN
// ============================================

const updateRemains = async (req, res) => {
  let transaction;
  let transactionStarted = false;

  try {
    const orderId = Number(req.params.id);
    const remains = Number(req.body?.remains);

    if (!Number.isSafeInteger(orderId) || orderId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID.",
      });
    }

    if (
      req.body?.remains === "" ||
      req.body?.remains === null ||
      req.body?.remains === undefined ||
      !Number.isSafeInteger(remains) ||
      remains < 0 ||
      remains > 2147483647
    ) {
      return res.status(400).json({
        success: false,
        message: "Remaining quantity must be a non-negative whole number.",
      });
    }

    const pool = await getDB();

    transaction = new sql.Transaction(pool);
    await transaction.begin();
    transactionStarted = true;

    // Lock the order while validating and updating it.
    const existingResult = await transaction.request()
      .input("id", sql.Int, orderId)
      .query(`
        SELECT id, quantity, status
        FROM dbo.orders WITH (UPDLOCK, HOLDLOCK)
        WHERE id = @id;
      `);

    const existingOrder = existingResult.recordset[0];

    if (!existingOrder) {
      await transaction.rollback();
      transactionStarted = false;

      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    if (remains > existingOrder.quantity) {
      await transaction.rollback();
      transactionStarted = false;

      return res.status(400).json({
        success: false,
        message: `Remaining quantity cannot exceed ordered quantity (${existingOrder.quantity}).`,
      });
    }

    const result = await transaction.request()
      .input("id", sql.Int, orderId)
      .input("remains", sql.Int, remains)
      .query(`
        UPDATE dbo.orders
        SET
          remains = @remains,
          status = CASE
            WHEN @remains = 0 THEN 'Completed'
            WHEN status = 'Completed' THEN 'In progress'
            ELSE status
          END,
          updated_at = GETDATE()
        OUTPUT
          INSERTED.id,
          INSERTED.quantity,
          INSERTED.start_count,
          INSERTED.remains,
          INSERTED.status,
          INSERTED.updated_at
        WHERE id = @id;
      `);

    await transaction.commit();
    transactionStarted = false;

    return res.status(200).json({
      success: true,
      message: "Remaining quantity updated successfully.",
      order: result.recordset[0],
    });

  } catch (error) {
    if (transactionStarted && transaction) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error("REMAINS ROLLBACK ERROR:", rollbackError);
      }
    }

    console.error("UPDATE REMAINS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update remaining quantity.",
    });
  }
};

module.exports = {
  getAdminOrders,
  updateOrderStatus,
  updateStartCount,
  updateRemains,
};
