const jwt = require("jsonwebtoken");
const { sql, getDB } = require("../config/db");

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authorization token required",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Support common user ID names in the JWT payload
    const userId = decoded.id ?? decoded.userId ?? decoded.user_id;

    if (!userId || !Number.isInteger(Number(userId))) {
      return res.status(401).json({
        success: false,
        message: "Invalid user information in token",
      });
    }

    // Get the user's CURRENT status from SQL Server
    const pool = await getDB();

    const result = await pool
      .request()
      .input("id", sql.Int, Number(userId))
      .query(`
        SELECT id, username, role, account_status
        FROM users
        WHERE id = @id
      `);

    const user = result.recordset[0];

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User account not found",
      });
    }

    // Block discontinued accounts, including users with old JWTs
    if (
      String(user.account_status || "").toLowerCase() ===
      "discontinued"
    ) {
      return res.status(403).json({
        success: false,
        message: "Your account has been discontinued. Please contact support.",
      });
    }

    // Preserve token fields while using the latest database role and user ID
    req.user = {
      ...decoded,
      id: user.id,
      username: user.username,
      role: user.role,
      account_status: user.account_status,
    };

    return next();
  } catch (error) {
    console.error("Authentication middleware error:", error);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

module.exports = authMiddleware;