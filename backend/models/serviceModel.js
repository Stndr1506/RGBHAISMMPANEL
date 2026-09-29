const { getDB } = require("../config/db");

const getAllServices = async () => {
    const pool = await getDB();

    const result = await pool.request().query(`
        SELECT
            id,
            category,
            service,
            rate,
            min_order,
            max_order,
            average_time,
            description
        FROM services
        ORDER BY category, id
    `);

    return result.recordset;
};

module.exports = {
    getAllServices
};