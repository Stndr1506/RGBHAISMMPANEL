const { sql, poolPromise } = require("../config/db");


const findUserByUsername = async (username) => {
  const pool = await poolPromise;

  const result = await pool
    .request()
    .input("username", sql.NVarChar(100), username)
    .query(`
      SELECT
        id,
        username,
        email,
        whatsapp,
        password,
        created_at
      FROM Users
      WHERE username = @username
    `);

  return result.recordset[0];
};


const findUserByEmail = async (email) => {
  const pool = await poolPromise;

  const result = await pool
    .request()
    .input("email", sql.NVarChar(255), email)
    .query(`
      SELECT
        id,
        username,
        email,
        whatsapp,
        password,
        created_at
      FROM Users
      WHERE email = @email
    `);

  return result.recordset[0];
};


const findUserByUsernameOrEmail = async (login) => {
  const pool = await poolPromise;

  const result = await pool
    .request()
    .input("login", sql.NVarChar(255), login)
    .query(`
      SELECT
        id,
        username,
        email,
        whatsapp,
        password,
        role,
        created_at
      FROM Users
      WHERE username = @login
         OR email = @login
    `);

  return result.recordset[0];
};


const createUser = async ({
  username,
  email,
  whatsapp,
  password,
}) => {
  const pool = await poolPromise;

  const transaction = new sql.Transaction(pool);

  try {
    // Start SQL transaction
    await transaction.begin();

    // 1. Create user
    const result = await transaction
      .request()
      .input("username", sql.NVarChar(100), username)
      .input("email", sql.NVarChar(255), email)
      .input("whatsapp", sql.NVarChar(30), whatsapp)
      .input("password", sql.NVarChar(255), password)
      .query(`
        INSERT INTO Users (
          username,
          email,
          whatsapp,
          password
        )
        OUTPUT
          INSERTED.id,
          INSERTED.username,
          INSERTED.email,
          INSERTED.whatsapp,
          INSERTED.created_at
        VALUES (
          @username,
          @email,
          @whatsapp,
          @password
        )
      `);

    const user = result.recordset[0];

    // 2. Create wallet for this user
    await transaction
      .request()
      .input("user_id", sql.Int, user.id)
      .query(`
        INSERT INTO wallets (
          user_id,
          balance,
          currency
        )
        VALUES (
          @user_id,
          0.00,
          'INR'
        )
      `);

    // 3. Commit both operations
    await transaction.commit();

    return user;

  } catch (error) {

    // Undo user creation if wallet creation fails
    try {
      await transaction.rollback();
    } catch (rollbackError) {
      console.error("Rollback error:", rollbackError);
    }

    throw error;
  }
};




const findUserById = async (id) => {
  const pool = await poolPromise;

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
      FROM Users
      WHERE id = @id
    `);

  return result.recordset[0];
};

module.exports = {
  findUserByUsername,
  findUserByEmail,
  findUserByUsernameOrEmail,
  createUser,
  findUserById,
};
