
const { sql, getDB } = require("../config/db");

// =====================================================
// CREATE ORDER + DEDUCT WALLET
// =====================================================

const createOrder = async ({
  userId,
  serviceId,
  link,
  quantity,
  source = "WEBSITE",
}) => {
  const pool = await getDB();
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);

    const orderSource = String(source).toUpperCase();

    if (!["WEBSITE", "API"].includes(orderSource)) {
      throw new Error("Invalid order source");
    }

    // 1. Get service details and lock the row
    const serviceResult = await new sql.Request(transaction)
      .input("service_id", sql.Int, Number(serviceId))
      .query(`
        SELECT
          id,
          category,
          service,
          rate,
          min_order,
          max_order,
          status
        FROM dbo.services WITH (UPDLOCK, HOLDLOCK)
        WHERE id = @service_id
      `);

    const selectedService = serviceResult.recordset[0];

    if (!selectedService) {
      throw new Error("Service not found");
    }

    // 2. Check service status
    if (
      String(selectedService.status).toLowerCase() !== "active"
    ) {
      throw new Error("Service is inactive");
    }

    // 3. Validate quantity
    const orderQuantity = Number(quantity);

    if (
      !Number.isInteger(orderQuantity) ||
      orderQuantity < selectedService.min_order ||
      orderQuantity > selectedService.max_order
    ) {
      throw new Error(
        `Quantity must be between ${selectedService.min_order} and ${selectedService.max_order}`
      );
    }

    // 4. Calculate amount
    const rate = Number(selectedService.rate);

    const amount = Number(
      ((orderQuantity / 1000) * rate).toFixed(2)
    );

    // 5. Deduct wallet balance
    const walletResult = await new sql.Request(transaction)
      .input("user_id", sql.Int, Number(userId))
      .input("amount", sql.Decimal(18, 2), amount)
      .query(`
        UPDATE dbo.wallets
        SET
          balance = balance - @amount,
          updated_at = GETDATE()
        WHERE
          user_id = @user_id
          AND balance >= @amount
      `);

    if (walletResult.rowsAffected[0] === 0) {
      throw new Error("Insufficient wallet balance");
    }

    // 6. Insert order
    const orderResult = await new sql.Request(transaction)
      .input("user_id", sql.Int, Number(userId))
      .input("service_id", sql.Int, Number(serviceId))
      .input("link", sql.VarChar(1000), link)
      .input("quantity", sql.Int, orderQuantity)
      .input("order_source", sql.VarChar(20), orderSource)
      .input("rate", sql.Decimal(10, 2), rate)
      .input("amount", sql.Decimal(18, 2), amount)
      .input("remains", sql.Int, orderQuantity)
      .query(`
        INSERT INTO dbo.orders (
          user_id,
          service_id,
          link,
          quantity,
          rate,
          amount,
          remains,
          status,
          order_source,
          created_at,
          updated_at
        )
        OUTPUT
          INSERTED.id,
          INSERTED.user_id,
          INSERTED.service_id,
          INSERTED.link,
          INSERTED.quantity,
          INSERTED.rate,
          INSERTED.amount,
          INSERTED.start_count,
          INSERTED.remains,
          INSERTED.status,
          INSERTED.order_source,
          INSERTED.created_at,
          INSERTED.updated_at
        VALUES (
          @user_id,
          @service_id,
          @link,
          @quantity,
          @rate,
          @amount,
          @remains,
          'Pending',
          @order_source,
          GETDATE(),
          GETDATE()
        )
      `);

    await transaction.commit();

    return {
      order: {
        ...orderResult.recordset[0],
        service_name: selectedService.service,
        category: selectedService.category,
      },
      amount,
    };

  } catch (error) {
    try {
      await transaction.rollback();
    } catch (rollbackError) {
      console.error("Rollback error:", rollbackError);
    }

    throw error;
  }
};

// =====================================================
// GET USER ORDERS
// =====================================================

const getOrdersByUserId = async (userId) => {
  const pool = await getDB();

  const result = await pool
    .request()
    .input("user_id", sql.Int, Number(userId))
    .query(`
      SELECT
        o.id,
        o.user_id,
        o.service_id,
        s.category,
        s.service AS service_name,
        o.link,
        o.quantity,
        o.rate,
        o.amount,
        o.start_count,
        o.remains,
        o.status,
        o.created_at,
        o.updated_at
      FROM orders o
      INNER JOIN services s ON o.service_id = s.id
      WHERE o.user_id = @user_id
      ORDER BY o.id DESC
    `);

  return result.recordset;
};

// =====================================================
// GET SINGLE ORDER
// =====================================================

const getOrderById = async (orderId, userId) => {
  const pool = await getDB();

  const result = await pool
    .request()
    .input("order_id", sql.Int, Number(orderId))
    .input("user_id", sql.Int, Number(userId))
    .query(`
      SELECT
        o.id,
        o.user_id,
        o.service_id,
        s.category,
        s.service AS service_name,
        o.link,
        o.quantity,
        o.rate,
        o.amount,
        o.start_count,
        o.remains,
        o.status,
        o.created_at,
        o.updated_at
      FROM orders o
      INNER JOIN services s ON o.service_id = s.id
      WHERE o.id = @order_id
        AND o.user_id = @user_id
    `);

  return result.recordset[0];
};


// =====================================================
// GET MULTIPLE ORDERS BY IDS FOR ONE USER
// =====================================================


const getOrdersByIds = async (orderIds, userId) => {
  const pool = await getDB();

  const request = pool.request();

  request.input("user_id", sql.Int, Number(userId));

  const placeholders = orderIds.map((id, index) => {
    const parameterName = `order_id_${index}`;

    request.input(parameterName, sql.Int, Number(id));

    return `@${parameterName}`;
  });

  const result = await request.query(`
    SELECT
      o.id,
      o.user_id,
      o.service_id,
      o.amount,
      o.start_count,
      o.remains,
      o.status,
      o.created_at,
      o.updated_at
    FROM dbo.orders AS o
    WHERE
      o.user_id = @user_id
      AND o.id IN (${placeholders.join(", ")})
  `);

  return result.recordset;
};

// ============================================
// GET API ORDERS ONLY - ADMIN
// ============================================

const getAllApiOrders = async ({ search = "", status = "" } = {}) => {
  const pool = await getDB();

  const result = await pool
    .request()
    .input("search", sql.NVarChar(255), `%${search.trim()}%`)
    .input("status", sql.VarChar(50), status || null)
    .query(`
      SELECT
        o.id,
        o.user_id,
        u.username,
        u.email,
        o.service_id,
        s.service AS service_name,
        o.link,
        o.quantity,
        o.rate,
        o.amount,
        o.start_count,
        o.remains,
        o.status,
        o.order_source,
        o.created_at,
        o.updated_at
      FROM dbo.orders AS o

      LEFT JOIN dbo.services AS s
        ON s.id = o.service_id

      LEFT JOIN dbo.Users AS u
        ON u.id = o.user_id

      WHERE
        o.order_source = 'API'
        AND (
          @search = '%%'
          OR CAST(o.id AS NVARCHAR(20)) LIKE @search
          OR u.username LIKE @search
          OR u.email LIKE @search
        )
        AND (
          @status IS NULL
          OR o.status = @status
        )

      ORDER BY o.created_at DESC;
    `);

  return result.recordset;
};



module.exports = {
  createOrder,
  getAllApiOrders,
  getOrdersByUserId,
  getOrderById,
  getOrdersByIds,
  getAllApiOrders,
};