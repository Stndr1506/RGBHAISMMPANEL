
const serviceModel = require("../models/adminServiceModel");
const walletModel = require("../models/walletModel");
const { createOrder, getOrderById, getOrdersByIds } = require("../models/orderModels");
const {
  createRefillRequest,
  getRefillStatusById,
  getRefillStatusesByIds,
  cancelPendingOrderAndRefund,
} = require("../models/apiOrderActionsModel");

// =====================================================
// RGBHAI API V2 CONTROLLER
// POST /api/v2
// =====================================================

const parseApiIdList = (rawValue) => {
  const parts = Array.isArray(rawValue)
    ? rawValue.map(String)
    : typeof rawValue === "string"
    ? rawValue.split(",")
    : [];

  if (
    parts.length === 0 ||
    parts.length > 100 ||
    parts.some((item) => !item.trim())
  ) {
    return null;
  }

  const ids = parts.map((item) => Number(item.trim()));

  if (
    ids.some((id) => !Number.isSafeInteger(id) || id <= 0) ||
    new Set(ids).size !== ids.length
  ) {
    return null;
  }

  return ids;
};

const handleApiRequest = async (req, res) => {
  try {
    const action = String(req.body?.action || "")
      .trim()
      .toLowerCase();

    const userId = Number(req.apiUser?.id);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({
        error: "Invalid API account.",
      });
    }

    // =================================================
    // ACTION 1: SERVICE LIST
    // =================================================

    if (action === "services") {
      const services = await serviceModel.getAllServices();

      const formattedServices = services.map((item) => ({
        service: Number(item.id),
        name: item.service,
        type: "Default",
        category: item.category || "Other",
        rate: Number(item.rate).toFixed(2),
        min: String(item.min_order),
        max: String(item.max_order),

        // These operations are not implemented yet.
        // Do not advertise them as available.
        refill: true,
        cancel: true,
      }));

      return res.status(200).json(formattedServices);
    }

    // =================================================
    // ACTION 2: RESELLER BALANCE
    // =================================================

    if (action === "balance") {
      const wallet =
        await walletModel.getWalletBalanceByUserId(userId);

      if (!wallet) {
        return res.status(404).json({
          error: "Wallet not found.",
        });
      }

      const balance = Number(wallet.balance);

      if (!Number.isFinite(balance)) {
        throw new Error("Invalid wallet balance.");
      }

      return res.status(200).json({
        balance: balance.toFixed(2),
        currency: wallet.currency || "INR",
      });
    }

    
    // =================================================
    // ACTION 3: ADD ORDER
    // =================================================

    if (action === "add") {
      const serviceId = Number(req.body?.service);
      const link = req.body?.link;
      const quantity = Number(req.body?.quantity);

      // Validate service ID
      if (!Number.isInteger(serviceId) || serviceId <= 0) {
        return res.status(400).json({
          error: "Invalid service ID."
        });
      }

      // Validate link
      if (
        typeof link !== "string" ||
        !link.trim() ||
        link.length > 1000
      ) {
        return res.status(400).json({
          error: "A valid link is required."
        });
      }

      // Validate quantity
      if (!Number.isInteger(quantity) || quantity <= 0) {
        return res.status(400).json({
          error: "Invalid quantity."
        });
      }

      // Use existing transactional order creation.
      // This calculates the price from SQL Server
      // and deducts the authenticated reseller's wallet.

      try {
        const result = await createOrder({
          userId,
          serviceId,
          link: link.trim(),
          quantity
        });

        return res.status(200).json({
          order: result.order.id
        });

      } catch (error) {
        if (error.message === "Insufficient wallet balance") {
          return res.status(400).json({
            error: "Not enough funds on balance."
          });
        }

        if (error.message === "Service not found") {
          return res.status(400).json({
            error: "Invalid service ID."
          });
        }

        if (error.message.startsWith("Quantity must be between")) {
          return res.status(400).json({
            error: error.message
          });
        }

        throw error;
      }
    }

    
    // =================================================
    // ACTION 4: ORDER STATUS
    // =================================================

    
    // =================================================
    // ACTION: SINGLE AND MULTIPLE ORDER STATUS
    // =================================================

    if (action === "status") {

      // -----------------------------------------------
      // MULTIPLE ORDER STATUS
      // -----------------------------------------------

      if (req.body?.orders !== undefined) {

        const rawOrders = req.body.orders;

        const orderParts = Array.isArray(rawOrders)
          ? rawOrders.map(String)
          : typeof rawOrders === "string"
          ? rawOrders.split(",")
          : [];

        if (
          orderParts.length === 0 ||
          orderParts.length > 100 ||
          orderParts.some((id) => !id.trim())
        ) {
          return res.status(400).json({
            error: "Please provide between 1 and 100 valid order IDs."
          });
        }

        const orderIds = orderParts.map((id) =>
          Number(id.trim())
        );

        if (
          orderIds.some(
            (id) => !Number.isSafeInteger(id) || id <= 0
          ) ||
          new Set(orderIds).size !== orderIds.length
        ) {
          return res.status(400).json({
            error: "Invalid or duplicate order IDs."
          });
        }

        // Fetch orders belonging only to this reseller.
        const orders = await getOrdersByIds(
          orderIds,
          userId
        );

        const wallet =
          await walletModel.getWalletBalanceByUserId(userId);

        if (!wallet) {
          return res.status(404).json({
            error: "Wallet not found."
          });
        }

        const orderMap = new Map(
          orders.map((order) => [
            Number(order.id),
            order
          ])
        );

        const response = {};

        for (const orderId of orderIds) {

          const order = orderMap.get(orderId);

          if (!order) {
            response[orderId] = {
              error: "Incorrect order ID"
            };

            continue;
          }

          response[orderId] = {
            charge: Number(order.amount).toFixed(2),

            start_count:
              order.start_count == null
                ? null
                : String(order.start_count),

            status: order.status,

            remains:
              order.remains == null
                ? null
                : String(order.remains),

            currency: wallet.currency || "INR"
          };
        }

        return res.status(200).json(response);
      }

      // =================================================
    // ACTION: SINGLE AND MULTIPLE ORDER STATUS
    // =================================================

      const orderId = Number(req.body?.order);

      if (
        !Number.isSafeInteger(orderId) ||
        orderId <= 0
      ) {
        return res.status(400).json({
          error: "Invalid order ID."
        });
      }

      const order = await getOrderById(
        orderId,
        userId
      );

      if (!order) {
        return res.status(404).json({
          error: "Incorrect order ID."
        });
      }

      const wallet =
        await walletModel.getWalletBalanceByUserId(userId);

      if (!wallet) {
        return res.status(404).json({
          error: "Wallet not found."
        });
      }

      return res.status(200).json({
        charge: Number(order.amount).toFixed(2),

        start_count:
          order.start_count == null
            ? null
            : String(order.start_count),

        status: order.status,

        remains:
          order.remains == null
            ? null
            : String(order.remains),

        currency: wallet.currency || "INR"
      });
    }

    // =====================================================
// ACTION 5: SINGLE REFILL
// =====================================================

if (action === "refill") {
  const orderId = Number(req.body?.order);

  if (!Number.isSafeInteger(orderId) || orderId <= 0) {
    return res.status(400).json({
      error: "Invalid order ID.",
    });
  }

  try {
    const refill = await createRefillRequest({
      orderId,
      userId,
    });

    return res.status(200).json({
      refill: String(refill.id),
    });

  } catch (error) {
    if (error.message === "Order not found.") {
      return res.status(404).json({ error: error.message });
    }

    if (
      error.message.includes("Refill is available") ||
      error.message.includes("already pending")
    ) {
      return res.status(400).json({ error: error.message });
    }

    throw error;
  }
}


// =====================================================
// ACTION 6: MULTIPLE REFILLS
// =====================================================

if (action === "refills") {
  const orderIds = parseApiIdList(req.body?.orders);

  if (!orderIds) {
    return res.status(400).json({
      error: "Provide between 1 and 100 valid, unique order IDs.",
    });
  }

  const response = [];

  for (const orderId of orderIds) {
    try {
      const refill = await createRefillRequest({
        orderId,
        userId,
      });

      response.push({
        order: orderId,
        refill: Number(refill.id),
      });

    } catch (error) {
      response.push({
        order: orderId,
        refill: {
          error: error.message,
        },
      });
    }
  }

  return res.status(200).json(response);
}


// =====================================================
// ACTION 7: SINGLE REFILL STATUS
// =====================================================

if (action === "refill_status") {
  const refillId = Number(req.body?.refill);

  if (!Number.isSafeInteger(refillId) || refillId <= 0) {
    return res.status(400).json({
      error: "Invalid refill ID.",
    });
  }

  const refill = await getRefillStatusById(
    refillId,
    userId
  );

  if (!refill) {
    return res.status(404).json({
      error: "Refill not found.",
    });
  }

  return res.status(200).json({
    status: refill.status,
  });
}


// =====================================================
// ACTION 8: MULTIPLE REFILL STATUSES
// =====================================================

if (action === "refill_statuses") {
  const refillIds = parseApiIdList(req.body?.refills);

  if (!refillIds) {
    return res.status(400).json({
      error: "Provide between 1 and 100 valid, unique refill IDs.",
    });
  }

  const refills = await getRefillStatusesByIds(
    refillIds,
    userId
  );

  const refillMap = new Map(
    refills.map((item) => [Number(item.id), item])
  );

  const response = refillIds.map((id) => {
    const refill = refillMap.get(id);

    return {
      refill: id,
      status: refill
        ? refill.status
        : { error: "Refill not found" },
    };
  });

  return res.status(200).json(response);
}


// =====================================================
// ACTION 9: CANCEL ORDERS
// =====================================================

if (action === "cancel") {
  const rawOrders =
    req.body?.orders !== undefined
      ? req.body.orders
      : req.body?.order;

  const orderIds = parseApiIdList(
    Array.isArray(rawOrders) ? rawOrders : String(rawOrders ?? "")
  );

  if (!orderIds) {
    return res.status(400).json({
      error: "Provide between 1 and 100 valid, unique order IDs.",
    });
  }

  const response = [];

  for (const orderId of orderIds) {
    try {
      await cancelPendingOrderAndRefund({
        orderId,
        userId,
      });

      response.push({
        order: orderId,
        cancel: 1,
      });

    } catch (error) {
      response.push({
        order: orderId,
        cancel: {
          error: error.message,
        },
      });
    }
  }

  return res.status(200).json(response);
}


    // =================================================
    // UNSUPPORTED ACTION
    // =================================================

    return res.status(400).json({
      error: action
        ? `Unsupported API action: ${action}`
        : "API action is required.",
    });

  } catch (error) {
    console.error("RGBHAI API ERROR:", error);

    return res.status(500).json({
      error: "Internal server error.",
    });
  }
};

module.exports = {
  handleApiRequest,
};
