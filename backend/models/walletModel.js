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

// Admin: Add or deduct wallet funds
const updateWalletBalance = async (userId, amount, action) => {
  const pool = await poolPromise;

  const result = await pool
    .request()
    .input("user_id", sql.Int, userId)
    .input("amount", sql.Decimal(18, 2), amount)
    .input("action", sql.VarChar(10), action)
    .query(`
      UPDATE wallets
      SET
        balance = CASE
          WHEN @action = 'ADD'
            THEN balance + @amount
          WHEN @action = 'DEDUCT'
            THEN balance - @amount
        END,
        updated_at = GETDATE()
      WHERE user_id = @user_id
        AND (
          @action = 'ADD'
          OR (
            @action = 'DEDUCT'
            AND balance >= @amount
          )
        );

      SELECT @@ROWCOUNT AS affectedRows;
    `);

  return result.recordset[0].affectedRows > 0;
};

module.exports = {
  getWalletByUserId,
  getWalletBalanceByUserId,
  updateWalletBalance
};
