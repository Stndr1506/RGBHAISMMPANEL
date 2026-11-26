
const { sql, getDB } = require("../config/db");

const {
  addProviderOrder,
   getProviderOrderStatus,
  decryptProviderApiKey,
  
} = require("../services/providerService");

// =====================================================
// CREATE ORDER + DEDUCT WALLET + SUBMIT TO PROVIDER
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

  let order;
  let selectedService;
  let providerDetails = null;
  let amount = 0;

  const orderSource = String(source).toUpperCase();
  const orderQuantity = Number(quantity);
  const cleanLink = String(link || "").trim();

  if (!["WEBSITE", "API"].includes(orderSource)) {
    throw new Error("Invalid order source");
  }

  if (!cleanLink) {
    throw new Error("Link is required");
  }

  if (
    !Number.isInteger(orderQuantity) ||
    orderQuantity <= 0
  ) {
    throw new Error("Invalid quantity");
  }

  try {
    await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);

    // 1. Lock and retrieve local service
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

    selectedService = serviceResult.recordset[0];

    if (!selectedService) {
      throw new Error("Service not found");
    }

    if (
      String(selectedService.status).toLowerCase() !== "active"
    ) {
      throw new Error("Service is inactive");
    }

    // 2. Validate quantity
    if (
      orderQuantity < Number(selectedService.min_order) ||
      orderQuantity > Number(selectedService.max_order)
    ) {
      throw new Error(
        `Quantity must be between ${selectedService.min_order} and ${selectedService.max_order}`
      );
    }

    // 3. Customer pays the local selling rate
    const customerRate = Number(selectedService.rate);

    amount = Number(
      ((orderQuantity / 1000) * customerRate).toFixed(2)
    );

    // 4. Find provider mapping, if this is an imported service
    const mappingResult = await new sql.Request(transaction)
      .input("local_service_id", sql.Int, Number(serviceId))
      .query(`
        SELECT
          ps.provider_id,
          ps.external_service_id,
          ps.provider_rate,
          p.api_url,
          p.api_key_encrypted,
          p.currency,
          p.exchange_rate_to_inr,
          p.status AS provider_status
        FROM dbo.provider_services ps
        INNER JOIN dbo.providers p
          ON p.id = ps.provider_id
        WHERE ps.local_service_id = @local_service_id
      `);

    providerDetails = mappingResult.recordset[0] || null;

    if (
      providerDetails &&
      String(providerDetails.provider_status).toLowerCase() !== "active"
    ) {
      throw new Error("The service provider is inactive");
    }

    // 5. Calculate provider cost separately
    let providerCost = null;

    if (providerDetails) {
      const providerRate = Number(providerDetails.provider_rate);
      const exchangeRate = Number(
        providerDetails.exchange_rate_to_inr
      );

      if (
        !Number.isFinite(providerRate) ||
        providerRate < 0 ||
        !Number.isFinite(exchangeRate) ||
        exchangeRate <= 0
      ) {
        throw new Error("Invalid provider rate or exchange rate");
      }

      providerCost = Number(
        (
          (orderQuantity / 1000) *
          providerRate *
          exchangeRate
        ).toFixed(2)
      );
    }

    // 6. Deduct customer selling amount
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

    // 7. Create local order
    const insertResult = await new sql.Request(transaction)
      .input("user_id", sql.Int, Number(userId))
      .input("service_id", sql.Int, Number(serviceId))
      .input("link", sql.VarChar(1000), cleanLink)
      .input("quantity", sql.Int, orderQuantity)
      .input("rate", sql.Decimal(10, 2), customerRate)
      .input("amount", sql.Decimal(18, 2), amount)
      .input("remains", sql.Int, orderQuantity)
      .input("order_source", sql.VarChar(20), orderSource)
      .input(
        "provider_id",
        sql.Int,
        providerDetails ? providerDetails.provider_id : null
      )
      .input(
        "provider_cost",
        sql.Decimal(18, 2),
        providerCost
      )
      .input(
        "provider_cost_currency",
        sql.VarChar(10),
        providerDetails ? "INR" : null
      )
      .input(
        "provider_submission_status",
        sql.VarChar(50),
        providerDetails ? "Pending" : null
      )
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
          provider_id,
          provider_cost,
          provider_cost_currency,
          provider_submission_status,
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
          INSERTED.provider_id,
          INSERTED.provider_order_id,
          INSERTED.provider_status,
          INSERTED.provider_submission_status,
          INSERTED.provider_cost,
          INSERTED.provider_cost_currency,
          INSERTED.provider_error,
          INSERTED.provider_submitted_at,
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
          @provider_id,
          @provider_cost,
          @provider_cost_currency,
          @provider_submission_status,
          GETDATE(),
          GETDATE()
        )
      `);

    order = insertResult.recordset[0];

    await transaction.commit();

  } catch (error) {
    try {
      await transaction.rollback();
    } catch (rollbackError) {
      console.error("Order rollback error:", rollbackError);
    }

    throw error;
  }

  // 8. No provider mapping: keep normal local-order behavior
  if (!providerDetails) {
    return {
      order: {
        ...order,
        service_name: selectedService.service,
        category: selectedService.category,
      },
      amount,
    };
  }

  // 9. Submit imported service order immediately
  try {
    const apiKey = decryptProviderApiKey(
      providerDetails.api_key_encrypted
    );

    const providerResponse = await addProviderOrder(
      providerDetails.api_url,
      apiKey,
      {
        service: providerDetails.external_service_id,
        link: cleanLink,
        quantity: orderQuantity,
      }
    );

    const providerOrderId =
      providerResponse?.order ?? providerResponse?.id;

    // A response without an order ID is ambiguous:
    // the provider might already have accepted the order.
    if (
      providerOrderId === undefined ||
      providerOrderId === null ||
      String(providerOrderId).trim() === ""
    ) {
      throw new Error(
        "Provider response did not contain an order ID. Submission requires review."
      );
    }

    await pool.request()
      .input("order_id", sql.Int, order.id)
      .input(
        "provider_order_id",
        sql.NVarChar(255),
        String(providerOrderId)
      )
      .input(
        "provider_status",
        sql.NVarChar(100),
        "Pending"
      )
      .query(`
        UPDATE dbo.orders
        SET
          provider_order_id = @provider_order_id,
          provider_status = @provider_status,
          provider_submission_status = 'Submitted',
          provider_submitted_at = SYSDATETIME(),
          updated_at = GETDATE()
        WHERE id = @order_id
      `);

    order.provider_order_id = String(providerOrderId);
    order.provider_status = "Pending";
    order.provider_submission_status = "Submitted";
    order.provider_submitted_at = new Date();

  } catch (providerError) {
    console.error(
      "Provider submission error:",
      providerError
    );

    // 10. Explicit rejection: refund customer
    if (providerError.providerRejected === true) {
      const refundTransaction = new sql.Transaction(pool);

      try {
        await refundTransaction.begin();

        await new sql.Request(refundTransaction)
          .input("user_id", sql.Int, Number(userId))
          .input("amount", sql.Decimal(18, 2), amount)
          .query(`
            UPDATE dbo.wallets
            SET
              balance = balance + @amount,
              updated_at = GETDATE()
            WHERE user_id = @user_id
          `);

        await new sql.Request(refundTransaction)
          .input("order_id", sql.Int, order.id)
          .input(
            "provider_error",
            sql.NVarChar(sql.MAX),
            String(providerError.message)
          )
          .query(`
            UPDATE dbo.orders
            SET
              status = 'Failed',
              provider_submission_status = 'Failed',
              provider_error = @provider_error,
              updated_at = GETDATE()
            WHERE id = @order_id
          `);

        await refundTransaction.commit();

        order.status = "Failed";
        order.provider_submission_status = "Failed";
        order.provider_error = String(providerError.message);
        order.wallet_refunded = true;

      } catch (refundError) {
        try {
          await refundTransaction.rollback();
        } catch (rollbackError) {
          console.error("Refund rollback error:", rollbackError);
        }

        console.error("Wallet refund failed:", refundError);

        await pool.request()
          .input("order_id", sql.Int, order.id)
          .input(
            "provider_error",
            sql.NVarChar(sql.MAX),
            `${providerError.message}. Refund error: ${refundError.message}`
          )
          .query(`
            UPDATE dbo.orders
            SET
              provider_submission_status = 'RefundFailed',
              provider_error = @provider_error,
              updated_at = GETDATE()
            WHERE id = @order_id
          `);

        order.provider_submission_status = "RefundFailed";
        order.provider_error = providerError.message;
        order.wallet_refunded = false;
        order.refund_error = refundError.message;
      }

    } else {
      // 11. Timeout/network/ambiguous response:
      // do not refund automatically because provider may have accepted.
      await pool.request()
        .input("order_id", sql.Int, order.id)
        .input(
          "provider_error",
          sql.NVarChar(sql.MAX),
          String(providerError.message || "Provider submission uncertain")
        )
        .query(`
          UPDATE dbo.orders
          SET
            provider_submission_status = 'Unknown',
            provider_error = @provider_error,
            updated_at = GETDATE()
          WHERE id = @order_id
        `);

      order.provider_submission_status = "Unknown";
      order.provider_error = String(providerError.message);
      order.wallet_refunded = false;
    }
  }

  return {
    order: {
      ...order,
      service_name: selectedService.service,
      category: selectedService.category,
    },
    amount,
  };
};

// =====================================================
// GET USER ORDERS
// =====================================================

const getOrdersByUserId = async (userId) => {
  const pool = await getDB();

  const result = await pool.request()
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
        o.provider_id,
        o.provider_order_id,
        o.provider_status,
        o.provider_submission_status,
        o.provider_cost,
        o.provider_cost_currency,
        o.provider_error,
        o.provider_submitted_at,
        o.created_at,
        o.updated_at
      FROM dbo.orders o
      INNER JOIN dbo.services s ON o.service_id = s.id
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

  const result = await pool.request()
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
        o.provider_id,
        o.provider_order_id,
        o.provider_status,
        o.provider_submission_status,
        o.provider_cost,
        o.provider_cost_currency,
        o.provider_error,
        o.provider_submitted_at,
        o.created_at,
        o.updated_at
      FROM dbo.orders o
      INNER JOIN dbo.services s ON o.service_id = s.id
      WHERE o.id = @order_id
        AND o.user_id = @user_id
    `);

  return result.recordset[0];
};


// =====================================================
// SYNC SINGLE ORDER STATUS FROM PROVIDER
// =====================================================

const syncProviderOrderStatus = async (
  orderId,
  { alreadyClaimed = false } = {}
) => {
  const pool = await getDB();

  const numericOrderId = Number(orderId);

  if (!Number.isSafeInteger(numericOrderId) || numericOrderId <= 0) {
    throw new Error("Invalid order ID.");
  }

  // 1. Fetch order and provider details
  const orderResult = await pool.request()
    .input("order_id", sql.Int, numericOrderId)
    .query(`
      SELECT
        o.id,
        o.status,
        o.start_count,
        o.remains,
        o.quantity,
        o.provider_id,
        o.provider_order_id,
        o.provider_submission_status,
        o.provider_status,
        p.api_url,
        p.api_key_encrypted
      FROM dbo.orders o
      INNER JOIN dbo.providers p
        ON p.id = o.provider_id
      WHERE o.id = @order_id
        AND o.provider_order_id IS NOT NULL
    `);

  const order = orderResult.recordset[0];

  if (!order) {
    throw new Error("Provider order not found");
  }

  if (order.provider_submission_status !== "Submitted") {
    throw new Error(
      "Order is not linked to a submitted provider order."
    );
  }

  // 2. Do not synchronize terminal orders
  const terminalStatuses = [
    "completed",
    "partial",
    "canceled",
    "cancelled",
    "failed",
  ];

  const existingProviderStatus = String(
    order.provider_status || ""
  ).trim().toLowerCase();

  const existingLocalStatus = String(
    order.status || ""
  ).trim().toLowerCase();

  if (
    terminalStatuses.includes(existingProviderStatus) ||
    terminalStatuses.includes(existingLocalStatus)
  ) {
    return {
      ...order,
      syncSkipped: true,
      syncReason: "Order already has a terminal status.",
    };
  }

  // 3. Manual sync must acquire the same lock as the scheduler
  let lockAcquired = alreadyClaimed;

  if (!alreadyClaimed) {
    const lockResult = await pool.request()
      .input("order_id", sql.Int, numericOrderId)
      .input("lock_seconds", sql.Int, 90)
      .query(`
        UPDATE dbo.orders
        SET provider_sync_lock_until = DATEADD(
          SECOND,
          @lock_seconds,
          SYSDATETIME()
        )
        OUTPUT INSERTED.id
        WHERE id = @order_id
          AND provider_id IS NOT NULL
          AND provider_order_id IS NOT NULL
          AND provider_submission_status = 'Submitted'
          AND ISNULL(status, '') NOT IN (
            'Completed',
            'Partial',
            'Canceled'
          )
          AND LOWER(ISNULL(provider_status, '')) NOT IN (
            'completed',
            'partial',
            'canceled',
            'cancelled',
            'failed'
          )
          AND (
            provider_sync_lock_until IS NULL
            OR provider_sync_lock_until <= SYSDATETIME()
          );
      `);

    lockAcquired = lockResult.recordset.length > 0;

    if (!lockAcquired) {
      throw new Error(
        "Provider order is already being synchronized or is not eligible."
      );
    }
  }

  try {
    // 4. Fetch latest status from provider
    const apiKey = decryptProviderApiKey(
      order.api_key_encrypted
    );

    const providerResponse = await getProviderOrderStatus(
      order.api_url,
      apiKey,
      order.provider_order_id
    );

    const rawStatus = String(
      providerResponse?.status || ""
    ).trim();

    if (!rawStatus) {
      throw new Error(
        "Provider returned an invalid order status."
      );
    }

    const normalizedStatus = rawStatus.toLowerCase();

    const statusMap = {
      pending: "Pending",
      processing: "Processing",
      "in progress": "In progress",
      completed: "Completed",
      partial: "Partial",
      canceled: "Canceled",
      cancelled: "Canceled",
      failed: "Canceled",
    };

    const finalStatus =
      statusMap[normalizedStatus] || order.status;

    // 5. Validate provider progress values
    const startCount =
      providerResponse.start_count !== undefined &&
      providerResponse.start_count !== null
        ? Number(providerResponse.start_count)
        : Number(order.start_count || 0);

    let remains =
      providerResponse.remains !== undefined &&
      providerResponse.remains !== null
        ? Number(providerResponse.remains)
        : Number(order.remains);

    if (
      !Number.isSafeInteger(startCount) ||
      startCount < 0 ||
      !Number.isSafeInteger(remains) ||
      remains < 0 ||
      remains > Number(order.quantity)
    ) {
      throw new Error(
        "Provider returned invalid order progress."
      );
    }

    if (finalStatus === "Completed") {
      remains = 0;
    }

    // 6. Update local order
    const updateResult = await pool.request()
      .input("order_id", sql.Int, order.id)
      .input(
        "provider_status",
        sql.NVarChar(100),
        rawStatus
      )
      .input("status", sql.VarChar(50), finalStatus)
      .input("start_count", sql.Int, startCount)
      .input("remains", sql.Int, remains)
      .query(`
        UPDATE dbo.orders
        SET
          provider_status = @provider_status,
          status = @status,
          start_count = @start_count,
          remains = @remains,
          provider_status_checked_at = SYSDATETIME(),
          updated_at = GETDATE()
        WHERE id = @order_id;

        SELECT
          id,
          status,
          provider_status,
          start_count,
          remains,
          provider_order_id,
          provider_submission_status,
          provider_status_checked_at,
          updated_at
        FROM dbo.orders
        WHERE id = @order_id;
      `);

    return updateResult.recordset[0];

  } finally {
    // 7. Always release the lock, even if provider API fails
    if (lockAcquired) {
      await pool.request()
        .input("order_id", sql.Int, numericOrderId)
        .query(`
          UPDATE dbo.orders
          SET
            provider_sync_lock_until = NULL,
            provider_status_checked_at = SYSDATETIME()
          WHERE id = @order_id;
        `);
    }
  }
};

const claimProviderOrdersForSync = async ({
  batchSize = 25,
  intervalSeconds = 60,
  lockSeconds = 90,
} = {}) => {
  const pool = await getDB();

  const result = await pool.request()
    .input("batch_size", sql.Int, batchSize)
    .input("interval_seconds", sql.Int, intervalSeconds)
    .input("lock_seconds", sql.Int, lockSeconds)
    .query(`
      ;WITH eligible_orders AS (
        SELECT TOP (@batch_size)
          id
        FROM dbo.orders WITH (UPDLOCK, ROWLOCK)
        WHERE
          provider_id IS NOT NULL
          AND provider_order_id IS NOT NULL
          AND provider_submission_status = 'Submitted'

          AND status NOT IN (
            'Completed',
            'Partial',
            'Canceled'
          )

          AND LOWER(ISNULL(provider_status, '')) NOT IN (
            'completed',
            'partial',
            'canceled',
            'cancelled',
            'failed'
          )

          AND (
            provider_status_checked_at IS NULL
            OR provider_status_checked_at <= DATEADD(
              SECOND,
              -@interval_seconds,
              SYSDATETIME()
            )
          )

          AND (
            provider_sync_lock_until IS NULL
            OR provider_sync_lock_until <= SYSDATETIME()
          )

        ORDER BY
          provider_status_checked_at ASC,
          id ASC
      )

      UPDATE o
      SET
        provider_sync_lock_until = DATEADD(
          SECOND,
          @lock_seconds,
          SYSDATETIME()
        )
      OUTPUT INSERTED.id
      FROM dbo.orders o
      INNER JOIN eligible_orders e
        ON e.id = o.id;
    `);

  return result.recordset.map((row) => row.id);
};
// =====================================================
// GET MULTIPLE ORDERS BY IDS FOR ONE USER
// =====================================================

const getOrdersByIds = async (orderIds, userId) => {
  const pool = await getDB();
  const request = pool.request();

  request.input("user_id", sql.Int, Number(userId));

  if (!Array.isArray(orderIds) || orderIds.length === 0) {
    return [];
  }

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
    FROM dbo.orders o
    WHERE
      o.user_id = @user_id
      AND o.id IN (${placeholders.join(", ")})
  `);

  return result.recordset;
};

// =====================================================
// GET API ORDERS ONLY - ADMIN
// =====================================================

const getAllApiOrders = async ({
  search = "",
  status = "",
} = {}) => {
  const pool = await getDB();

  const result = await pool.request()
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
        o.provider_id,
        o.provider_order_id,
        o.provider_status,
        o.provider_submission_status,
        o.provider_cost,
        o.provider_cost_currency,
        o.provider_error,
        o.provider_submitted_at,
        o.created_at,
        o.updated_at
      FROM dbo.orders o
      LEFT JOIN dbo.services s ON s.id = o.service_id
      LEFT JOIN dbo.Users u ON u.id = o.user_id
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
      ORDER BY o.created_at DESC
    `);

  return result.recordset;
};

module.exports = {
  createOrder,
  getAllApiOrders,
  getOrdersByUserId,
  getOrderById,
  getOrdersByIds,
  syncProviderOrderStatus,
  claimProviderOrdersForSync,
};
