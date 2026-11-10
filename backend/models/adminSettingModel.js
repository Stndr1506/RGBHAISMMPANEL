const { sql, getDB } = require("../config/db");

// GET ADMIN SETTINGS
const getAdminSettings = async () => {
  const pool = await getDB();

  const result = await pool.request().query(`
    SELECT
      id,
      whatsapp_number,
      qr_image_path,
      logo_image_path,
      updated_at
    FROM dbo.admin_settings
    WHERE id = 1
  `);

  return result.recordset[0];
};

// UPDATE ADMIN SETTINGS
const updateAdminSettings = async ({
  whatsappNumber,
  qrImagePath,
  logoImagePath
}) => {
  const pool = await getDB();

  const request = pool.request();

  request.input(
    "whatsappNumber",
    sql.NVarChar(20),
    whatsappNumber
  );

  request.input(
    "qrImagePath",
    sql.NVarChar(500),
    qrImagePath || null
  );
  request.input(
    "logoImagePath",
    sql.NVarChar(500), 
    logoImagePath || null
);

  const result = await request.query(`
    UPDATE dbo.admin_settings
    SET
      whatsapp_number = @whatsappNumber,
      qr_image_path = COALESCE(@qrImagePath, qr_image_path),
      logo_image_path = COALESCE(@logoImagePath, logo_image_path),
      updated_at = GETDATE()
    WHERE id = 1;

    SELECT
      id,
      whatsapp_number,
      qr_image_path,
      logo_image_path,
      updated_at
    FROM dbo.admin_settings
    WHERE id = 1;
  `);

  return result.recordset[0];
};

module.exports = {
  getAdminSettings,
  updateAdminSettings,
};