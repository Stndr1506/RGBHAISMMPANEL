const { sql, getDB } = require("../config/db");

// =====================================================
// CREATE REFILL REQUEST
// =====================================================

const createRefillRequest = async ({ orderId, userId }) => {
  const pool = await getDB();
  const transaction = new sql.Transaction(pool);

  let finished = false;

  try {
    await transaction.begin();

    // Lock the order to prevent simultaneous duplicate requests.
    const orderResult = await transaction.request()
      .input("orderId", sql.Int, orderId)
      .input("userId", sql.Int, userId)
      .query(`
        SELECT id, status
        FROM dbo.orders WITH (UPDLOCK, HOLDLOCK)
        WHERE id = @orderId
          AND user_id = @userId;
      `);

    const order = orderResult.recordset[0];

    if (!order) {
      throw new Error("Order not found.");
    }

    const currentStatus = String(order.status || "")
      .trim()
      .toLowerCase();

    if (!["completed", "partial"].includes(currentStatus)) {
      throw new Error(
        "Refill is available only for Completed or Partial orders."
      );
    }

    // Prevent duplicate active refill requests.
    const existingRefill = await transaction.request()
      .input("orderId", sql.Int, orderId)
      .input("userId", sql.Int, userId)
      .query(`
        SELECT TOP 1 id
        FROM dbo.api_refills WITH (UPDLOCK, HOLDLOCK)
        WHERE order_id = @orderId
          AND user_id = @userId
          AND status IN ('Pending', 'In progress');
      `);

    if (existingRefill.recordset.length > 0) {
      throw new Error(
        "A refill request is already pending for this order."
      );
    }

    const result = await transaction.request()
      .input("orderId", sql.Int, orderId)
      .input("userId", sql.Int, userId)
      .query(`
        INSERT INTO dbo.api_refills (
          order_id,
          user_id
        )
        OUTPUT
          INSERTED.id,
          INSERTED.order_id,
          INSERTED.status,
          INSERTED.created_at
        VALUES (
          @orderId,
          @userId
        );
      `);

    await transaction.commit();
    finished = true;

    return result.recordset[0];

  } catch (error) {
    if (!finished) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error("Refill rollback error:", rollbackError);
      }
    }

    throw error;
  }
};


// =====================================================
// GET SINGLE REFILL STATUS
// =====================================================

const getRefillStatusById = async (refillId, userId) => {
  const pool = await getDB();

  const result = await pool.request()
    .input("id", sql.Int, refillId)
    .input("userId", sql.Int, userId)
    .query(`
      SELECT id, order_id, status, created_at, updated_at
      FROM dbo.api_refills
      WHERE id = @id
        AND user_id = @userId;
    `);

  return result.recordset[0] || null;
};


// =====================================================
// GET MULTIPLE REFILL STATUSES
// =====================================================

const getRefillStatusesByIds = async (refillIds, userId) => {
  const pool = await getDB();
  const request = pool.request();

  request.input("userId", sql.Int, userId);

  const parameters = refillIds.map((id, index) => {
    const parameterName = `refillId${index}`;

    request.input(parameterName, sql.Int, id);

    return `@${parameterName}`;
  });

  const result = await request.query(`
    SELECT id, order_id, status, created_at, updated_at
    FROM dbo.api_refills
    WHERE user_id = @userId
      AND id IN (${parameters.join(", ")});
  `);

  return result.recordset;
};


// =====================================================
// CANCEL PENDING ORDER AND REFUND WALLET
// =====================================================

const cancelPendingOrderAndRefund = async ({ orderId, userId }) => {
  const pool = await getDB();
  const transaction = new sql.Transaction(pool);

  let finished = false;

  try {
    await transaction.begin();

    // Lock the order before checking its status.
    const orderResult = await transaction.request()
      .input("orderId", sql.Int, orderId)
      .input("userId", sql.Int, userId)
      .query(`
        SELECT id, amount, status
        FROM dbo.orders WITH (UPDLOCK, HOLDLOCK)
        WHERE id = @orderId
          AND user_id = @userId;
      `);

    const order = orderResult.recordset[0];

    if (!order) {
      throw new Error("Order not found.");
    }

    if (
      String(order.status || "").trim().toLowerCase() !== "pending"
    ) {
      throw new Error(
        "Order can only be canceled while Pending."
      );
    }

    const refundAmount = Number(order.amount);

    if (!Number.isFinite(refundAmount) || refundAmount < 0) {
      throw new Error("Invalid order refund amount.");
    }

    // Refund the reseller's wallet.
    const walletResult = await transaction.request()
      .input("userId", sql.Int, userId)
      .input("amount", sql.Decimal(18, 2), refundAmount)
      .query(`
        UPDATE dbo.wallets
        SET balance = balance + @amount
        WHERE user_id = @userId;
      `);

    if (
      !walletResult.rowsAffected ||
      walletResult.rowsAffected[0] !== 1
    ) {
      throw new Error("Wallet not found. Refund could not be processed.");
    }

    // Cancel the order only after the wallet refund succeeds.
    const updateResult = await transaction.request()
      .input("orderId", sql.Int, orderId)
      .input("userId", sql.Int, userId)
      .query(`
        UPDATE dbo.orders
        SET
          status = 'Canceled',
          updated_at = GETDATE()
        OUTPUT
          INSERTED.id,
          INSERTED.status,
          INSERTED.amount
        WHERE id = @orderId
          AND user_id = @userId
          AND status = 'Pending';
      `);

    if (updateResult.recordset.length === 0) {
      throw new Error("Order status changed. Cancellation aborted.");
    }

    await transaction.commit();
    finished = true;

    return {
      ...updateResult.recordset[0],
      refunded: refundAmount,
    };

  } catch (error) {
    if (!finished) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error("Cancellation rollback error:", rollbackError);
      }
    }

    throw error;
  }
};


module.exports = {
  createRefillRequest,
  getRefillStatusById,
  getRefillStatusesByIds,
  cancelPendingOrderAndRefund,
};