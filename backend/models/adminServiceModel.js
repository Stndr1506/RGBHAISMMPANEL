const { sql, getDB } = require("../config/db");

// =====================================================
// GET ALL SERVICES
// =====================================================

const getAllServices = async () => {
  const pool = await getDB();

  const result = await pool.request().query(`
    SELECT
      id,
      category,
      service,
      description,
      rate,
      min_order,
      max_order,
      average_time,
      display_order,
      status,
      created_at,
      updated_at
    FROM services
    ORDER BY id DESC
  `);

  return result.recordset;
};

// =====================================================
// GET SERVICE BY ID
// =====================================================

const getServiceById = async (id) => {
  const pool = await getDB();

  const result = await pool
    .request()
    .input("id", sql.Int, id)
    .query(`
      SELECT
        id,
        category,
        service,
        description,
        rate,
        min_order,
        max_order,
        average_time,
        display_order,
        status,
        created_at,
        updated_at
      FROM services
      WHERE id = @id
    `);

  return result.recordset[0];
};

// =====================================================
// CREATE SERVICE
// =====================================================

const createService = async (serviceData) => {
  const {
    category,
    service,
    description,
    rate,
    min_order,
    max_order,
    average_time,
  } = serviceData;

  const pool = await getDB();

  const result = await pool
    .request()
    .input(
      "category",
      sql.NVarChar(255),
      category
    )
    .input(
      "service",
      sql.NVarChar(500),
      service
    )
    .input(
      "description",
      sql.NVarChar(2500),
      description
    )
    .input(
      "rate",
      sql.Decimal(10, 2),
      rate
    )
    .input(
      "min_order",
      sql.Int,
      min_order
    )
    .input(
      "max_order",
      sql.Int,
      max_order
    )
    .input(
      "average_time",
      sql.VarChar(100),
      average_time
    )
    .query(`
      INSERT INTO services (
        category,
        service,
        description,
        rate,
        min_order,
        max_order,
        average_time
      )
      OUTPUT
        INSERTED.id,
        INSERTED.category,
        INSERTED.service,
        INSERTED.description,
        INSERTED.rate,
        INSERTED.min_order,
        INSERTED.max_order,
        INSERTED.average_time,
        INSERTED.display_order,
        INSERTED.created_at,
        INSERTED.updated_at
      VALUES (
        @category,
        @service,
        @description,
        @rate,
        @min_order,
        @max_order,
        @average_time
      )
    `);

  return result.recordset[0];
};

// =====================================================
// UPDATE SERVICE
// =====================================================

const updateService = async (id, serviceData) => {
  const {
    category,
    service,
    description,
    rate,
    min_order,
    max_order,
    average_time,
  } = serviceData;

  const pool = await getDB();

  const result = await pool
    .request()
    .input("id", sql.Int, id)
    .input(
      "category",
      sql.NVarChar(300),
      category
    )
    .input(
      "service",
      sql.NVarChar(500),
      service
    )
    .input(
      "description",
      sql.NVarChar(2500),
      description
    )
    .input(
      "rate",
      sql.Decimal(10, 2),
      rate
    )
    .input(
      "min_order",
      sql.Int,
      min_order
    )
    .input(
      "max_order",
      sql.Int,
      max_order
    )
    .input(
      "average_time",
      sql.VarChar(100),
      average_time
    )
    .query(`
      UPDATE services
      SET
        category = @category,
        service = @service,
        description = @description,
        rate = @rate,
        min_order = @min_order,
        max_order = @max_order,
        average_time = @average_time,
        updated_at = GETDATE()
      OUTPUT
        INSERTED.id,
        INSERTED.category,
        INSERTED.service,
        INSERTED.description,
        INSERTED.rate,
        INSERTED.min_order,
        INSERTED.max_order,
        INSERTED.average_time,
        INSERTED.created_at,
        INSERTED.updated_at
      WHERE id = @id
    `);

  return result.recordset[0];
};

// =====================================================
// DELETE SERVICE
// =====================================================

const deleteService = async (id) => {
   const pool = await getDB();

    const result = await pool.request()
        .input("id", sql.Int, Number(id))
        .query(`
            UPDATE services
            SET status = 'Inactive',
                updated_at = GETDATE()
            WHERE id = @id
        `);

    return result.rowsAffected[0] > 0;
};


// =====================================================
// BULK CREATE SERVICES
// =====================================================

const bulkCreateServices = async (services) => {
  const pool = await getDB();
  const transaction = new sql.Transaction(pool);

  const insertedServices = [];

  try {
    await transaction.begin();

    for (const serviceData of services) {
      const {
        category,
        service,
        description,
        rate,
        min_order,
        max_order,
        average_time,
      } = serviceData;

      const result = await transaction
        .request()
        .input("category", sql.NVarChar(255), category)
        .input("service", sql.NVarChar(500), service)
        .input("description", sql.NVarChar(2500), description)
        .input("rate", sql.Decimal(10, 2), rate)
        .input("min_order", sql.Int, min_order)
        .input("max_order", sql.Int, max_order)
        .input("average_time", sql.VarChar(100), average_time)
        .query(`
          INSERT INTO services (
            category,
            service,
            description,
            rate,
            min_order,
            max_order,
            average_time
          )
          OUTPUT
            INSERTED.id,
            INSERTED.category,
            INSERTED.service,
            INSERTED.description,
            INSERTED.rate,
            INSERTED.min_order,
            INSERTED.max_order,
            INSERTED.average_time,
            INSERTED.created_at,
            INSERTED.updated_at
          VALUES (
            @category,
            @service,
            @description,
            @rate,
            @min_order,
            @max_order,
            @average_time
          )
        `);

      insertedServices.push(result.recordset[0]);
    }

    await transaction.commit();

    return insertedServices;
  } catch (error) {
    try {
      await transaction.rollback();
    } catch (rollbackError) {
      console.error("BULK INSERT ROLLBACK ERROR:", rollbackError);
    }

    throw error;
  }
};


// =====================================================
// REORDER SERVICES
// =====================================================

const reorderServices = async (serviceIds) => {
  if (
    !Array.isArray(serviceIds) ||
    serviceIds.length === 0 ||
    serviceIds.some(
      (id) => !Number.isInteger(Number(id)) || Number(id) <= 0
    )
  ) {
    throw new Error("Invalid service order.");
  }

  const ids = serviceIds.map(Number);

  if (new Set(ids).size !== ids.length) {
    throw new Error("Duplicate service IDs are not allowed.");
  }

  const pool = await getDB();
  const transaction = new sql.Transaction(pool);

  let transactionStarted = false;

  try {
    await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
    transactionStarted = true;

    // Lock and retrieve the current service list.
    const existing = await transaction.request().query(`
      SELECT id
      FROM dbo.services WITH (UPDLOCK, HOLDLOCK)
    `);

    const existingIds = existing.recordset.map(
      (item) => Number(item.id)
    );

    const requestedIds = new Set(ids);

    // Make sure the submitted list contains every service exactly once.
    if (
      existingIds.length !== ids.length ||
      existingIds.some((id) => !requestedIds.has(id))
    ) {
      throw new Error(
        "Service list has changed. Refresh the page and try again."
      );
    }

    // Build a parameterized SQL CASE statement.
    const request = transaction.request();

    const whenClauses = ids.map((id, index) => {
      request.input(`id${index}`, sql.Int, id);

      return `WHEN @id${index} THEN ${index + 1}`;
    });

    const placeholders = ids.map(
      (_, index) => `@id${index}`
    );

    await request.query(`
      UPDATE dbo.services
      SET display_order = CASE id
        ${whenClauses.join("\n")}
        ELSE display_order
      END
      WHERE id IN (${placeholders.join(",")})
    `);

    await transaction.commit();
    transactionStarted = false;

    return true;

  } catch (error) {
    if (transactionStarted) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error("REORDER ROLLBACK ERROR:", rollbackError);
      }
    }

    throw error;
  }
};


module.exports = {
  getAllServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
  bulkCreateServices,
  reorderServices
};
