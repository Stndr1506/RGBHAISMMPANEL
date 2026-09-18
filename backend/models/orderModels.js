const { sql, getDB } = require("../config/db");

// =====================================================
// CREATE ORDER + DEDUCT WALLET
// =====================================================

const createOrder = async ({
  userId,
  serviceId,
  link,
  quantity,
}) => {

  const pool = await getDB();

  const transaction = new sql.Transaction(pool);

  try {

    await transaction.begin();

    // =================================================
    // 1. GET SERVICE
    // =================================================

    const serviceResult = await new sql.Request(transaction)
      .input("service_id", sql.Int, serviceId)
      .query(`
        SELECT
          id,
          category,
          service,
          rate,
          min_order,
          max_order
        FROM services
        WHERE id = @service_id
      `);

    const service = serviceResult.recordset[0];

    if (!service) {
      throw new Error("Service not found");
    }


    // =================================================
    // 2. VALIDATE QUANTITY
    // =================================================

    if (
      quantity < service.min_order ||
      quantity > service.max_order
    ) {

      throw new Error(
        `Quantity must be between ${service.min_order} and ${service.max_order}`
      );
    }


    // =================================================
    // 3. CALCULATE AMOUNT
    // =================================================

    const rate = Number(service.rate);

    const amount =
      (Number(quantity)) * rate;


    // =================================================
    // 4. DEDUCT WALLET
    // =================================================

    const walletResult = await new sql.Request(transaction)
      .input("user_id", sql.Int, userId)
      .input(
        "amount",
        sql.Decimal(18, 2),
        amount
      )
      .query(`
        UPDATE wallets

        SET
          balance = balance - @amount,
          updated_at = GETDATE()

        WHERE
          user_id = @user_id
          AND balance >= @amount
      `);


    // =================================================
    // 5. CHECK WALLET UPDATE
    // =================================================

    if (walletResult.rowsAffected[0] === 0) {

      throw new Error(
        "Insufficient wallet balance"
      );
    }


    // =================================================
    // 6. CREATE ORDER
    // =================================================

    const orderResult = await new sql.Request(transaction)
      .input(
        "user_id",
        sql.Int,
        userId
      )
      .input(
        "service_id",
        sql.Int,
        serviceId
      )
      .input(
        "link",
        sql.VarChar(1000),
        link
      )
      .input(
        "quantity",
        sql.Int,
        quantity
      )
      .input(
        "rate",
        sql.Decimal(10, 2),
        rate
      )
      .input(
        "amount",
        sql.Decimal(18, 2),
        amount
      )
      .query(`
        INSERT INTO orders
        (
          user_id,
          service_id,
          link,
          quantity,
          rate,
          amount,
          status,
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
          INSERTED.status,
          INSERTED.created_at

        VALUES
        (
          @user_id,
          @service_id,
          @link,
          @quantity,
          @rate,
          @amount,
          'Pending',
          GETDATE(),
          GETDATE()
        )
      `);


    // =================================================
    // 7. COMMIT
    // =================================================

    await transaction.commit();


    return {
      order: orderResult.recordset[0],
      amount,
    };

  } catch (error) {

    // Rollback if anything fails
    try {
      await transaction.rollback();
    } catch (rollbackError) {
      console.error(
        "Rollback error:",
        rollbackError
      );
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
    .input(
      "user_id",
      sql.Int,
      userId
    )
    .query(`
      SELECT
        o.id,
        o.user_id,
        o.service_id,
        s.category,
        s.service,
        o.link,
        o.quantity,
        o.rate,
        o.amount,
        o.status,
        o.created_at,
        o.updated_at

      FROM orders o

      INNER JOIN services s
        ON o.service_id = s.id

      WHERE o.user_id = @user_id

      ORDER BY o.id DESC
    `);

  return result.recordset;
};


// =====================================================
// GET ORDER BY ID
// =====================================================

const getOrderById = async (
  orderId,
  userId
) => {

  const pool = await getDB();

  const result = await pool
    .request()
    .input(
      "order_id",
      sql.Int,
      orderId
    )
    .input(
      "user_id",
      sql.Int,
      userId
    )
    .query(`
      SELECT
        o.id,
        o.user_id,
        o.service_id,
        s.category,
        s.service,
        o.link,
        o.quantity,
        o.rate,
        o.amount,
        o.status,
        o.created_at,
        o.updated_at

      FROM orders o

      INNER JOIN services s
        ON o.service_id = s.id

      WHERE
        o.id = @order_id
        AND o.user_id = @user_id
    `);

  return result.recordset[0];
};


module.exports = {
  createOrder,
  getOrdersByUserId,
  getOrderById,
};