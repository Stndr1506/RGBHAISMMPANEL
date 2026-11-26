
const {
  createOrder,
  getOrdersByUserId,
  getOrderById,
} = require("../models/orderModels");

// =====================================================
// CREATE ORDER
// =====================================================

const placeOrder = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication required",
      });
    }

    const { serviceId, link, quantity } = req.body;

    if (!serviceId || !Number.isInteger(Number(serviceId)) ||
        Number(serviceId) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid service is required",
      });
    }

    if (!link || !String(link).trim()) {
      return res.status(400).json({
        success: false,
        message: "Link is required",
      });
    }

    const orderQuantity = Number(quantity);

    if (!Number.isInteger(orderQuantity) || orderQuantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid quantity",
      });
    }

    const result = await createOrder({
      userId,
      serviceId: Number(serviceId),
      link: String(link).trim(),
      quantity: orderQuantity,
    });

    const order = result.order;

    // Explicit provider rejection and successful refund
    if (
      order.provider_submission_status === "Failed" &&
      order.wallet_refunded === true
    ) {
      return res.status(502).json({
        success: false,
        message: "Provider rejected the order. Your wallet has been refunded.",
        order,
        amount: result.amount,
        walletRefunded: true,
      });
    }

    // Refund itself failed
    if (order.provider_submission_status === "RefundFailed") {
      return res.status(202).json({
        success: false,
        message:
          "Provider rejected the order, but your refund needs support review. Please do not place this order again.",
        order,
        amount: result.amount,
        walletRefunded: false,
      });
    }

    // Provider response was uncertain
    if (order.provider_submission_status === "Unknown") {
      return res.status(202).json({
        success: true,
        message:
          "Your order was created, but provider acceptance could not be confirmed. Please do not submit it again while it is under review.",
        order,
        amount: result.amount,
        providerConfirmationPending: true,
      });
    }

    return res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order,
      amount: result.amount,
    });

  } catch (error) {
    console.error("Place order error:", error);

    const knownErrors = [
      "Insufficient wallet balance",
      "Service is inactive",
      "The service provider is inactive",
      "Service not found",
      "Invalid order source",
      "Invalid quantity",
      "Link is required",
      "Invalid provider rate or exchange rate",
    ];

    if (knownErrors.includes(error.message)) {
      return res.status(
        error.message === "Service not found" ? 404 : 400
      ).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message.startsWith("Quantity must be between")) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to place order",
    });
  }
};

// =====================================================
// GET MY ORDERS
// =====================================================

const getMyOrders = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication required",
      });
    }

    const orders = await getOrdersByUserId(userId);

    return res.status(200).json({
      success: true,
      orders,
    });

  } catch (error) {
    console.error("Get orders error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch orders",
    });
  }
};

// =====================================================
// GET SINGLE ORDER
// =====================================================

const getMyOrderById = async (req, res) => {
  try {
    const userId = req.user?.id;
    const orderId = Number(req.params.id);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication required",
      });
    }

    if (!Number.isInteger(orderId) || orderId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    const order = await getOrderById(orderId, userId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.status(200).json({
      success: true,
      order,
    });

  } catch (error) {
    console.error("Get order error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch order",
    });
  }
};

module.exports = {
  placeOrder,
  getMyOrders,
  getMyOrderById,
};
