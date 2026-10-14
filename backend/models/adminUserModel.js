const { sql, getDB } = require("../config/db");

// =====================================================
// GET ALL USERS
// =====================================================

const getAllUsers = async () => {
  const pool = await getDB();

  const result = await pool.request().query(`
    SELECT
    u.id,
    u.username,
    u.email,
    u.whatsapp,
    u.created_at,
    ISNULL(w.balance, 0) AS balance
FROM users u
LEFT JOIN wallets w
    ON w.user_id = u.id
ORDER BY u.id DESC;
  `);

  return result.recordset;
};


// =====================================================
// GET USER BY ID
// =====================================================

const getUserByIdAdmin = async (id) => {
  const pool = await getDB();

  const result = await pool
    .request()
    .input("id", sql.Int, id)
    .query(`
      SELECT
        id,
        username,
        email,
        whatsapp,
        created_at
      FROM users
      WHERE id = @id
    `);

  return result.recordset[0];
};


// ============================================
// DISCONTINUE / REACTIVATE USER
// ============================================

const updateUserStatus = async (id, status) => {
  const pool = await getDB();

  const result = await pool
    .request()
    .input("id", sql.Int, id)
    .input("status", sql.VarChar(20), status)
    .query(`
      UPDATE users
      SET account_status = @status
      OUTPUT
        INSERTED.id,
        INSERTED.username,
        INSERTED.email,
        INSERTED.account_status
      WHERE id = @id;
    `);

  return result.recordset[0] || null;
};


module.exports = {
  getAllUsers,
  getUserByIdAdmin,
  updateUserStatus
};