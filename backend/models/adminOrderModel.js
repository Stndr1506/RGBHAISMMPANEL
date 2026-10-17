
const { poolPromise } = require("../config/db");

// GET ALL ORDERS WITH SERVICE DETAILS
const getAllOrders = async () => {
  try {
    const pool = await poolPromise;

    const result = await pool.request().query(`
      SELECT
        o.id,
        o.user_id,
        o.service_id,
        o.link,
        o.quantity,
        o.rate,
        o.amount,
        o.start_count,
        o.status,
        o.created_at,
        o.updated_at,
        s.service AS service_name
      FROM dbo.orders AS o
      LEFT JOIN dbo.services AS s
        ON s.id = o.service_id
      ORDER BY o.created_at DESC;
    `);

    return result.recordset;
  } catch (error) {
    console.error("Get all orders error:", error);
    throw error;
  }
};

module.exports = {
  getAllOrders,
};
