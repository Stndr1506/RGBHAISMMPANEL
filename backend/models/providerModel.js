
const { getDB, sql } = require("../config/db");

// Save a new provider
const createProvider = async ({
  providerName,
  apiUrl,
  encryptedApiKey,
  currency = "USD",
}) => {
  const pool = await getDB();

  const result = await pool
    .request()
    .input("providerName", sql.NVarChar(150), providerName)
    .input("apiUrl", sql.NVarChar(1000), apiUrl)
    .input("encryptedApiKey", sql.NVarChar(sql.MAX), encryptedApiKey)
    .input("currency", sql.VarChar(10), currency)
    .query(`
      INSERT INTO dbo.providers (
        provider_name,
        api_url,
        api_key_encrypted,
        currency,
        status
      )
      OUTPUT
        INSERTED.id,
        INSERTED.provider_name,
        INSERTED.api_url,
        INSERTED.currency,
        INSERTED.status,
        INSERTED.created_at
      VALUES (
        @providerName,
        @apiUrl,
        @encryptedApiKey,
        @currency,
        'Active'
      );
    `);

  return result.recordset[0];
};

// Find provider by ID (includes encrypted key for internal use)
const getProviderById = async (providerId) => {
  const pool = await getDB();

  const result = await pool
    .request()
    .input("providerId", sql.Int, providerId)
    .query(`
      SELECT *
      FROM dbo.providers
      WHERE id = @providerId;
    `);

  return result.recordset[0] || null;
};

// Get all providers (never return encrypted keys)
const getAllProviders = async () => {
  const pool = await getDB();

  const result = await pool.request().query(`
    SELECT
      id,
      provider_name,
      api_url,
      currency,
      exchange_rate_to_inr,
      status,
      created_at,
      updated_at
    FROM dbo.providers
    ORDER BY id DESC;
  `);

  return result.recordset;
};

// Update provider
const updateProvider = async ({
  providerId,
  providerName,
  apiUrl,
  encryptedApiKey,
  currency,
}) => {
  const pool = await getDB();

  const request = pool.request()
    .input("providerId", sql.Int, providerId)
    .input("providerName", sql.NVarChar(150), providerName)
    .input("apiUrl", sql.NVarChar(1000), apiUrl)
    .input("currency", sql.VarChar(10), currency);

  let keyUpdate = "";

  if (encryptedApiKey) {
    request.input(
      "encryptedApiKey",
      sql.NVarChar(sql.MAX),
      encryptedApiKey
    );

    keyUpdate = ", api_key_encrypted = @encryptedApiKey";
  }

  const result = await request.query(`
    UPDATE dbo.providers
    SET
      provider_name = @providerName,
      api_url = @apiUrl,
      currency = @currency,
      status = 'Active',
      updated_at = GETDATE()
      ${keyUpdate}
    WHERE id = @providerId;

    SELECT
      id,
      provider_name,
      api_url,
      currency,
      exchange_rate_to_inr,
      status,
      updated_at
    FROM dbo.providers
    WHERE id = @providerId;
  `);

  return result.recordset[0] || null;
};

// Disconnect provider (soft disconnect)
const disconnectProvider = async (providerId) => {
  const pool = await getDB();

  const result = await pool
    .request()
    .input("providerId", sql.Int, providerId)
    .query(`
      UPDATE dbo.providers
      SET
        status = 'Inactive',
        updated_at = GETDATE()
      WHERE id = @providerId;

      SELECT
        id,
        provider_name,
        api_url,
        currency,
        status,
        updated_at
      FROM dbo.providers
      WHERE id = @providerId;
    `);

  return result.recordset[0] || null;
};

module.exports = {
  createProvider,
  getProviderById,
  getAllProviders,
  updateProvider,
  disconnectProvider,
};
