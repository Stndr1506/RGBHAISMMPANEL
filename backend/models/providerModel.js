
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


// Import selected provider services into local services
const importProviderServices = async ({
  providerId,
  services,
  markupType,
  markupValue,
}) => {
  if (!Array.isArray(services) || services.length === 0) {
    throw new Error("Please select at least one service");
  }

  if (!["percent", "fixed"].includes(markupType)) {
    throw new Error("Invalid markup type");
  }

  const markup = Number(markupValue);

  if (!Number.isFinite(markup) || markup < 0) {
    throw new Error("Invalid markup value");
  }

  const pool = await getDB();
  const transaction = new sql.Transaction(pool);

  const imported = [];
  const skipped = [];

  await transaction.begin();

  try {
    // Get the next display order
    const orderRequest = new sql.Request(transaction);

    const orderResult = await orderRequest.query(`
      SELECT ISNULL(MAX(display_order), 0) AS maxOrder
      FROM dbo.services;
    `);

    let nextOrder = Number(orderResult.recordset[0].maxOrder) + 1;

    for (const item of services) {
      const externalServiceId = String(item.serviceId ?? "").trim();
      const serviceName = String(item.name ?? "").trim();
      const category = String(item.category || "Uncategorized").trim();

      const providerRate = Number(item.rate);
      const minOrder = Number(item.min);
      const maxOrder = Number(item.max);

      if (
        !externalServiceId ||
        !serviceName ||
        !Number.isFinite(providerRate) ||
        providerRate < 0 ||
        !Number.isInteger(minOrder) ||
        !Number.isInteger(maxOrder) ||
        minOrder < 0 ||
        maxOrder < minOrder
      ) {
        skipped.push({
          serviceId: externalServiceId,
          reason: "Invalid service information",
        });
        continue;
      }

      // Check whether provider service is already imported
      const duplicateRequest = new sql.Request(transaction);

      const duplicateResult = await duplicateRequest
        .input("providerId", sql.Int, providerId)
        .input("externalId", sql.NVarChar(200), externalServiceId)
        .query(`
          SELECT id
          FROM dbo.provider_services
          WHERE provider_id = @providerId
            AND external_service_id = @externalId;
        `);

      if (duplicateResult.recordset.length > 0) {
        skipped.push({
          serviceId: externalServiceId,
          reason: "Already imported",
        });
        continue;
      }

      // Calculate customer selling rate
      const customerRate =
        markupType === "percent"
          ? providerRate * (1 + markup / 100)
          : providerRate + markup;

      const roundedRate = Number(customerRate.toFixed(2));

      if (!Number.isFinite(roundedRate) || roundedRate > 99999999.99) {
        skipped.push({
          serviceId: externalServiceId,
          reason: "Customer rate exceeds the allowed limit",
        });
        continue;
      }

      const description = String(item.description || "").slice(0, 5000);
      const averageTime = String(
        item.averageTime || "Not specified"
      ).slice(0, 100);

      // Create local service
      const serviceRequest = new sql.Request(transaction);

      const serviceResult = await serviceRequest
        .input("category", sql.NVarChar(600), category.slice(0, 600))
        .input("service", sql.NVarChar(1000), serviceName.slice(0, 1000))
        .input("description", sql.NVarChar(5000), description || null)
        .input("rate", sql.Decimal(10, 2), roundedRate)
        .input("minOrder", sql.Int, minOrder)
        .input("maxOrder", sql.Int, maxOrder)
        .input("averageTime", sql.VarChar(100), averageTime)
        .input("displayOrder", sql.Int, nextOrder)
        .query(`
          INSERT INTO dbo.services (
            category,
            service,
            description,
            rate,
            min_order,
            max_order,
            average_time,
            display_order,
            status
          )
          OUTPUT INSERTED.id
          VALUES (
            @category,
            @service,
            @description,
            @rate,
            @minOrder,
            @maxOrder,
            @averageTime,
            @displayOrder,
            'Active'
          );
        `);

      const localServiceId = serviceResult.recordset[0].id;

      // Create provider mapping
      const mappingRequest = new sql.Request(transaction);

      await mappingRequest
        .input("providerId", sql.Int, providerId)
        .input("localServiceId", sql.Int, localServiceId)
        .input("externalId", sql.NVarChar(200), externalServiceId)
        .input("externalName", sql.NVarChar(1000), serviceName.slice(0, 1000))
        .input("externalType", sql.NVarChar(200), item.type || null)
        .input("externalCategory", sql.NVarChar(600), category.slice(0, 600))
        .input("providerRate", sql.Decimal(18, 8), providerRate)
        .input("minOrder", sql.Int, minOrder)
        .input("maxOrder", sql.Int, maxOrder)
        .input("refill", sql.Bit, Boolean(item.refill))
        .input("cancel", sql.Bit, Boolean(item.cancel))
        .input(
          "markupPercent",
          sql.Decimal(8, 2),
          markupType === "percent" ? markup : 0
        )
        .query(`
          INSERT INTO dbo.provider_services (
            provider_id,
            local_service_id,
            external_service_id,
            external_service_name,
            external_service_type,
            external_category,
            provider_rate,
            provider_min_order,
            provider_max_order,
            refill_enabled,
            cancel_enabled,
            markup_percent,
            created_at,
            updated_at
          )
          VALUES (
            @providerId,
            @localServiceId,
            @externalId,
            @externalName,
            @externalType,
            @externalCategory,
            @providerRate,
            @minOrder,
            @maxOrder,
            @refill,
            @cancel,
            @markupPercent,
            GETDATE(),
            GETDATE()
          );
        `);

      imported.push({
        externalServiceId,
        localServiceId,
        serviceName,
        customerRate: roundedRate,
      });

      nextOrder++;
    }

    await transaction.commit();

    return {
      imported,
      skipped,
      importedCount: imported.length,
      skippedCount: skipped.length,
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};



module.exports = {
  createProvider,
  getProviderById,
  getAllProviders,
  updateProvider,
  disconnectProvider,
  importProviderServices,
};
