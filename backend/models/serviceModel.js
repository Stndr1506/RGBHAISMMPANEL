const { getDB } = require("../config/db");

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
            created_at,
            updated_at
        FROM dbo.services
        WHERE status = 'Active'
        ORDER BY
            category ASC,
            display_order ASC,
            id DESC
    `);

    return result.recordset;
};

module.exports = {
    getAllServices
};