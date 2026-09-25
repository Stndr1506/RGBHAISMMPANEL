const sql = require("mssql");
const { poolPromise } = require("../config/db");

// =====================================================
// GET ALL ORDERS
// =====================================================

const getAllOrders = async () => {
  try {
    const pool = await poolPromise;

    const result = await pool.request().query(`
      SELECT
        id,
        username,
        service,
        link,
        quantity,
        rate,
        amount,
        status,
        created_at,
        updated_at
      FROM orders
      ORDER BY created_at DESC
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