const sql = require("mssql");
const { poolPromise } = require("../config/db");

const Payment = {
  // Get all payments with username
  getAllPayments: async () => {
    const pool = await poolPromise;

    const result = await pool.request().query(`
      SELECT
        p.id,
        u.username,
        p.amount,
        p.created_at,
        p.gateway,
        p.gateway_order_id,
        p.gateway_payment_id,
        p.utr,
        p.status
      FROM payments p
      INNER JOIN users u
        ON p.user_id = u.id
      ORDER BY p.created_at DESC
    `);

    return result.recordset;
  },

  // Get payment by ID
  getPaymentById: async (id) => {
    const pool = await poolPromise;

    const result = await pool
      .request()
      .input("id", sql.Int, id)
      .query(`
        SELECT
          p.id,
          u.username,
          p.amount,
          p.created_at,
          p.gateway,
          p.gateway_order_id,
          p.gateway_payment_id,
          p.utr,
          p.status
        FROM payments p
        INNER JOIN users u
          ON p.user_id = u.id
        WHERE p.id = @id
      `);

    return result.recordset[0];
  }
};

module.exports = Payment;