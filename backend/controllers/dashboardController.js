const { sql, poolPromise } = require("../config/db");

const getDashboardData = async (req, res) => {
  try {
    const userId = req.user.id;

    const pool = await poolPromise;

    // Get logged-in user's username and wallet balance
    const userResult = await pool
      .request()
      .input("user_id", sql.Int, userId)
      .query(`
        SELECT
          u.username,
          ISNULL(w.balance, 0) AS balance
        FROM Users u
        LEFT JOIN wallets w
          ON w.user_id = u.id
        WHERE u.id = @user_id
      `);

    // Get total orders across the entire panel
    const orderResult = await pool
      .request()
      .query(`
        SELECT COUNT(*) AS total_orders
        FROM orders
      `);

    if (userResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const user = userResult.recordset[0];

    res.json({
      success: true,
      data: {
        username: user.username,
        balance: Number(user.balance),
        totalOrders: Number(orderResult.recordset[0].total_orders),
      },
    });

  } catch (error) {
    console.error("Dashboard error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard data",
    });
  }
};

module.exports = {
  getDashboardData,
};