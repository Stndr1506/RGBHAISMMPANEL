const { sql, getDB } = require("../config/db");

// =====================================================
// GET ALL ANNOUNCEMENTS - ADMIN
// =====================================================

const getAllAnnouncements = async () => {
  const pool = await getDB();

  const result = await pool.request().query(`
    SELECT
      id,
      title,
      type,
      message,
      service_id,
      status,
      created_at,
      updated_at
    FROM announcements
    ORDER BY id DESC
  `);

  return result.recordset;
};


// =====================================================
// GET PUBLISHED ANNOUNCEMENTS - USER
// =====================================================

const getPublishedAnnouncements = async () => {
  const pool = await getDB();

  const result = await pool.request().query(`
    SELECT
      a.id,
      a.title,
      a.type,
      a.message,
      a.service_id,
      a.status,
      a.created_at,
      a.updated_at,
      s.service
    FROM announcements a
    LEFT JOIN services s
      ON a.service_id = s.id
    WHERE a.status = 'published'
    ORDER BY a.id DESC
  `);

  return result.recordset;
};


// =====================================================
// GET SINGLE ANNOUNCEMENT
// =====================================================

const getAnnouncementById = async (id) => {
  const pool = await getDB();

  const result = await pool
    .request()
    .input("id", sql.Int, id)
    .query(`
      SELECT
        id,
        title,
        type,
        message,
        service_id,
        status,
        created_at,
        updated_at
      FROM announcements
      WHERE id = @id
    `);

  return result.recordset[0];
};


// =====================================================
// CREATE ANNOUNCEMENT
// =====================================================

const createAnnouncement = async ({
  title,
  type,
  message,
  service_id,
  status
}) => {

  const pool = await getDB();

  const result = await pool
    .request()
    .input("title", sql.NVarChar(255), title)
    .input("type", sql.VarChar(50), type)
    .input("message", sql.NVarChar(sql.MAX), message)
    .input(
      "service_id",
      service_id ? sql.Int : sql.Int,
      service_id || null
    )
    .input(
      "status",
      sql.VarChar(20),
      status || "published"
    )
    .query(`
      INSERT INTO announcements
      (
        title,
        type,
        message,
        service_id,
        status,
        created_at,
        updated_at
      )
      VALUES
      (
        @title,
        @type,
        @message,
        @service_id,
        @status,
        GETDATE(),
        GETDATE()
      );

      SELECT SCOPE_IDENTITY() AS id;
    `);

  return result.recordset[0];
};


// =====================================================
// UPDATE ANNOUNCEMENT
// =====================================================

const updateAnnouncement = async (
  id,
  {
    title,
    type,
    message,
    service_id,
    status
  }
) => {

  const pool = await getDB();

  const result = await pool
    .request()
    .input("id", sql.Int, id)
    .input("title", sql.NVarChar(255), title)
    .input("type", sql.VarChar(50), type)
    .input("message", sql.NVarChar(sql.MAX), message)
    .input(
      "service_id",
      service_id ? sql.Int : sql.Int,
      service_id || null
    )
    .input("status", sql.VarChar(20), status)
    .query(`
      UPDATE announcements
      SET
        title = @title,
        type = @type,
        message = @message,
        service_id = @service_id,
        status = @status,
        updated_at = GETDATE()
      WHERE id = @id
    `);

  return result.rowsAffected[0];
};


// =====================================================
// DELETE ANNOUNCEMENT
// =====================================================

const deleteAnnouncement = async (id) => {
  const pool = await getDB();

  const result = await pool
    .request()
    .input("id", sql.Int, id)
    .query(`
      DELETE FROM announcements
      WHERE id = @id
    `);

  return result.rowsAffected[0];
};


// =====================================================
// EXPORT
// =====================================================

module.exports = {
  getAllAnnouncements,
  getPublishedAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement
};