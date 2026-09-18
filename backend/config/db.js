const sql = require("mssql");
require("dotenv").config();

const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,

  options: {
    encrypt: false,
    trustServerCertificate: true,
  },

  port: Number(process.env.DB_PORT) || 1433,

  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};
  
const poolPromise = new sql.ConnectionPool(dbConfig)
  .connect()
  .then((pool) => {
    console.log("SQL Server connected successfully");
    return pool;
  })
  .catch((error) => {
    console.error("SQL Server connection failed:", error);
    throw error;
  });

const getDB = async () => {
  return await poolPromise;
};


module.exports = {
  sql,
  poolPromise,
  getDB
};
