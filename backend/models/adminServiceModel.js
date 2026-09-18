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
      sql.VarChar(255),
      category
    )
    .input(
      "service",
      sql.VarChar(500),
      service
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
        rate,
        min_order,
        max_order,
        average_time
      )
      OUTPUT
        INSERTED.id,
        INSERTED.category,
        INSERTED.service,
        INSERTED.rate,
        INSERTED.min_order,
        INSERTED.max_order,
        INSERTED.average_time,
        INSERTED.created_at,
        INSERTED.updated_at
      VALUES (
        @category,
        @service,
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
      sql.VarChar(255),
      category
    )
    .input(
      "service",
      sql.VarChar(500),
      service
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
        rate = @rate,
        min_order = @min_order,
        max_order = @max_order,
        average_time = @average_time,
        updated_at = GETDATE()
      OUTPUT
        INSERTED.id,
        INSERTED.category,
        INSERTED.service,
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

  const result = await pool
    .request()
    .input("id", sql.Int, id)
    .query(`
      DELETE FROM services
      OUTPUT DELETED.id
      WHERE id = @id
    `);

  return result.recordset[0];
};

module.exports = {
  getAllServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
};
