
const { sql, poolPromise } = require("../config/db");

// =====================================================
// CREATE API KEY
// =====================================================

const createApiKey = async ({
  userId,
  keyHash,
  keyPrefix,
  name,
}) => {
  const pool = await poolPromise;

  const result = await pool
    .request()
    .input("user_id", sql.Int, Number(userId))
    .input("key_hash", sql.Char(64), keyHash)
    .input("key_prefix", sql.VarChar(20), keyPrefix)
    .input("name", sql.NVarChar(100), name || null)
    .query(`
      INSERT INTO dbo.api_keys (
        user_id,
        key_hash,
        key_prefix,
        name,
        is_active
      )
      OUTPUT
        INSERTED.id,
        INSERTED.user_id,
        INSERTED.key_prefix,
        INSERTED.name,
        INSERTED.is_active,
        INSERTED.created_at
      VALUES (
        @user_id,
        @key_hash,
        @key_prefix,
        @name,
        1
      );
    `);

  return result.recordset[0];
};


// =====================================================
// GET ALL API KEYS FOR A USER
// =====================================================

const getApiKeysByUserId = async (userId) => {
  const pool = await poolPromise;

  const result = await pool
    .request()
    .input("user_id", sql.Int, Number(userId))
    .query(`
      SELECT
        id,
        user_id,
        key_prefix,
        name,
        is_active,
        created_at,
        last_used_at,
        revoked_at
      FROM dbo.api_keys
      WHERE user_id = @user_id
      ORDER BY created_at DESC, id DESC;
    `);

  return result.recordset;
};


// =====================================================
// FIND API KEY BY HASH
// =====================================================

const findActiveApiKeyByHash = async (keyHash) => {
  const pool = await poolPromise;

  const result = await pool
    .request()
    .input("key_hash", sql.Char(64), keyHash)
    .query(`
      SELECT TOP 1
        ak.id AS api_key_id,
        ak.user_id,
        ak.name AS key_name,
        ak.is_active,
        u.username,
        u.email,
        u.role,
        u.account_status
      FROM dbo.api_keys AS ak
      INNER JOIN dbo.Users AS u
        ON u.id = ak.user_id
      WHERE
        ak.key_hash = @key_hash
        AND ak.is_active = 1
        AND ak.revoked_at IS NULL;
    `);

  return result.recordset[0] || null;
};


// =====================================================
// UPDATE API KEY LAST USED
// =====================================================

const updateApiKeyLastUsed = async (apiKeyId) => {
  const pool = await poolPromise;

  await pool
    .request()
    .input("id", sql.Int, Number(apiKeyId))
    .query(`
      UPDATE dbo.api_keys
      SET last_used_at = SYSDATETIME()
      WHERE id = @id
        AND is_active = 1
        AND revoked_at IS NULL;
    `);
};


// =====================================================
// REVOKE API KEY
// =====================================================

const revokeApiKey = async (apiKeyId, userId) => {
  const pool = await poolPromise;

  const result = await pool
    .request()
    .input("id", sql.Int, Number(apiKeyId))
    .input("user_id", sql.Int, Number(userId))
    .query(`
      UPDATE dbo.api_keys
      SET
        is_active = 0,
        revoked_at = SYSDATETIME()
      WHERE
        id = @id
        AND user_id = @user_id
        AND is_active = 1
        AND revoked_at IS NULL;
    `);

  return result.rowsAffected[0] > 0;
};


// =====================================================
// EXPORTS
// =====================================================

module.exports = {
  createApiKey,
  getApiKeysByUserId,
  findActiveApiKeyByHash,
  updateApiKeyLastUsed,
  revokeApiKey,
};
