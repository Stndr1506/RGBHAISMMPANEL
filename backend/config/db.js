
const sql = require("mssql");
require("dotenv").config();

const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,

  port: Number(process.env.DB_PORT) || 1433,

  options: {
    encrypt: true,
    trustServerCertificate: true,
  },

  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

const poolPromise = new sql.ConnectionPool(dbConfig)
  .connect()
  .then((pool) => {
    console.log("Azure SQL Database connected successfully");
    return pool;
  })
  .catch((error) => {
    console.error("SQL Server connection failed:", error.message);
    throw error;
  });

const getDB = async () => {
  return await poolPromise;
};

module.exports = {
  sql,
  poolPromise,
  getDB,
};
