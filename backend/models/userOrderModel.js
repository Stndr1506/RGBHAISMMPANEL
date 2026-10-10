
const { sql, getDB } = require("../config/db");

// ============================================
// GET ALL ORDERS FOR A PARTICULAR USER
// ============================================

const getOrdersByUserId = async (userId) => {
  const pool = await getDB();

  const result = await pool
    .request()
    .input("userId", sql.Int, userId)
    .query(`
      SELECT
        o.id,
        o.user_id,
        o.service_id,
        o.link,
        o.quantity,
        o.rate,
        o.amount,
        o.status,
        o.created_at,
        o.updated_at,
        s.service AS service_name,

        CAST(NULL AS BIGINT) AS start_count,
        CAST(NULL AS BIGINT) AS remains

      FROM orders AS o

      LEFT JOIN services AS s
        ON s.id = o.service_id

      WHERE o.user_id = @userId

      ORDER BY o.created_at DESC, o.id DESC;
    `);

  return result.recordset;
};

module.exports = {
  getOrdersByUserId,
};