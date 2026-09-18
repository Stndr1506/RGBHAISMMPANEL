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



module.exports = {
  getAllServices,
  getServiceById,
};
