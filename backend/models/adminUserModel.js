const { sql, getDB } = require("../config/db");

// =====================================================
// GET ALL USERS
// =====================================================

const getAllUsers = async () => {
  const pool = await getDB();

  const result = await pool.request().query(`
    SELECT
      id,
      username,
      email,
      whatsapp,
      created_at
    FROM users
    ORDER BY id DESC
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


module.exports = {
  getAllUsers,
  getUserByIdAdmin,
};