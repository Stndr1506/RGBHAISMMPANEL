const { sql, poolPromise } = require("../config/db");

const createPayment = async ({
  userId,
  amount,
  gateway,
  gatewayOrderId,
}) => {
  const pool = await poolPromise;

  const result = await pool
    .request()
    .input("user_id", sql.BigInt, userId)
    .input("amount", sql.Numeric(18, 2), amount)
    .input("gateway", sql.VarChar(50), gateway)
    .input(
      "gateway_order_id",
      sql.VarChar(200),
      gatewayOrderId
    )
    .query(`
      INSERT INTO Payments (
        user_id,
        amount,
        gateway,
        gateway_order_id,
        status
      )
      OUTPUT
        INSERTED.id,
        INSERTED.user_id,
        INSERTED.amount,
        INSERTED.gateway,
        INSERTED.gateway_order_id,
        INSERTED.status,
        INSERTED.created_at
      VALUES (
        @user_id,
        @amount,
        @gateway,
        @gateway_order_id,
        'CREATED'
      )
    `);

  return result.recordset[0];
};

const getPaymentByGatewayOrderId = async (
  gatewayOrderId
) => {
  const pool = await poolPromise;

  const result = await pool
    .request()
    .input(
      "gateway_order_id",
      sql.VarChar(200),
      gatewayOrderId
    )
    .query(`
      SELECT TOP 1
        id,
        user_id,
        amount,
        gateway,
        gateway_order_id,
        status,
        created_at
      FROM Payments
      WHERE gateway_order_id = @gateway_order_id
    `);

  return result.recordset[0] || null;
};


// ============================================
// MARK PAYMENT SUCCESS
// ============================================

const markPaymentSuccess = async ({
  paymentId,
  transactionId,
}) => {
  const pool = await poolPromise;

  const result = await pool
    .request()
    .input("id", sql.Int, paymentId)
    .input(
      "transaction_id",
      sql.VarChar(200),
      transactionId || null
    )
    .query(`
      UPDATE Payments
      SET
        status = 'SUCCESS',
        transaction_id = @transaction_id,
        updated_at = GETDATE()
      WHERE id = @id
        AND status <> 'SUCCESS'
    `);

  return result.rowsAffected[0] > 0;
};


// ============================================
// MARK PAYMENT FAILED
// ============================================

const markPaymentFailed = async ({
  paymentId,
}) => {
  const pool = await poolPromise;

  const result = await pool
    .request()
    .input("id", sql.Int, paymentId)
    .query(`
      UPDATE Payments
      SET
        status = 'FAILED',
        updated_at = GETDATE()
      WHERE id = @id
        AND status = 'CREATED'
    `);

  return result.rowsAffected[0] > 0;
};

const verifyAndCreditWallet = async ({
  paymentId,
  userId,
  amount,
  transactionId,
}) => {
  const pool = await poolPromise;

  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();

    const request = new sql.Request(transaction);

    // ==========================================
    // 1. Lock/check payment
    // ==========================================

    const paymentResult = await request
      .input("payment_id", sql.Int, paymentId)
      .query(`
        SELECT
          id,
          user_id,
          amount,
          status
        FROM Payments WITH (UPDLOCK, ROWLOCK)
        WHERE id = @payment_id
      `);

    const payment = paymentResult.recordset[0];

    if (!payment) {
      throw new Error("Payment not found");
    }

    // ==========================================
    // 2. Prevent duplicate wallet credit
    // ==========================================

    if (payment.status === "SUCCESS") {
      await transaction.rollback();

      return {
        alreadyProcessed: true,
        credited: false,
      };
    }

    // ==========================================
    // 3. Safety checks
    // ==========================================

    if (Number(payment.user_id) !== Number(userId)) {
      throw new Error("Payment user mismatch");
    }

    if (
      Number(payment.amount).toFixed(2) !==
      Number(amount).toFixed(2)
    ) {
      throw new Error("Payment amount mismatch");
    }

    if (payment.status !== "CREATED") {
      throw new Error(
        `Payment cannot be processed from status ${payment.status}`
      );
    }

    // ==========================================
    // 4. Mark payment SUCCESS
    // ==========================================

    const updatePayment =
      await new sql.Request(transaction)
        .input("payment_id", sql.Int, paymentId)
        .input(
          "transaction_id",
          sql.VarChar(200),
          transactionId
        )
        .query(`
          UPDATE Payments
          SET
            status = 'SUCCESS',
            transaction_id = @transaction_id,
            updated_at = GETDATE()
          WHERE id = @payment_id
            AND status = 'CREATED'
        `);

    if (updatePayment.rowsAffected[0] !== 1) {
      throw new Error(
        "Payment was already processed"
      );
    }

    // ==========================================
    // 5. Credit wallet
    // ==========================================

    const updateWallet =
      await new sql.Request(transaction)
        .input("user_id", sql.Int, userId)
        .input(
          "amount",
          sql.Numeric(18, 2),
          amount
        )
        .query(`
          UPDATE wallets
          SET
            balance = balance + @amount,
            updated_at = GETDATE()
          WHERE user_id = @user_id
        `);

    if (updateWallet.rowsAffected[0] !== 1) {
      throw new Error(
        "Wallet not found"
      );
    }

    // ==========================================
    // 6. Commit everything
    // ==========================================

    await transaction.commit();

    return {
      alreadyProcessed: false,
      credited: true,
    };

  } catch (error) {

    try {
      await transaction.rollback();
    } catch (rollbackError) {
      console.error(
        "Rollback error:",
        rollbackError
      );
    }

    throw error;
  }
};

module.exports = {
  createPayment,
  getPaymentByGatewayOrderId,
  markPaymentSuccess,
  markPaymentFailed,
  verifyAndCreditWallet
};
