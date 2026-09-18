const { sql, poolPromise } = require("../config/db");

const getWalletByUserId = async (userId) => {
  const pool = await poolPromise;

  const result = await pool
    .request()
    .input("user_id", sql.Int, userId)
    .query(`
      SELECT
        id,
        user_id,
        balance,
        currency,
        created_at,
        updated_at
      FROM wallets
      WHERE user_id = @user_id
    `);

  return result.recordset[0];
};


// Get only wallet balance
const getWalletBalanceByUserId = async (userId) => {
  const pool = await poolPromise;

  const result = await pool
    .request()
    .input("user_id", sql.Int, userId)
    .query(`
      SELECT balance, currency
      FROM wallets
      WHERE user_id = @user_id
    `);

  return result.recordset[0];
};

module.exports = {
  getWalletByUserId,
  getWalletBalanceByUserId,
};
