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

    // ================================================
    // USER FROM JWT
    // ================================================

    const userId = req.user?.id;

    if (!userId) {

      return res.status(401).json({
        success: false,
        message: "User authentication required",
      });

    }


    // ================================================
    // REQUEST DATA
    // ================================================

    const {
      serviceId,
      link,
      quantity,
    } = req.body;


    // ================================================
    // VALIDATION
    // ================================================

    if (!serviceId) {

      return res.status(400).json({
        success: false,
        message: "Service is required",
      });

    }


    if (!link || !link.trim()) {

      return res.status(400).json({
        success: false,
        message: "Link is required",
      });

    }


    if (!quantity) {

      return res.status(400).json({
        success: false,
        message: "Quantity is required",
      });

    }


    const orderQuantity = Number(quantity);

    if (
      !Number.isInteger(orderQuantity) ||
      orderQuantity <= 0
    ) {

      return res.status(400).json({
        success: false,
        message: "Invalid quantity",
      });

    }


    // ================================================
    // CREATE ORDER
    // ================================================

    const result = await createOrder({

      userId,

      serviceId: Number(serviceId),

      link: link.trim(),

      quantity: orderQuantity,

    });


    // ================================================
    // SUCCESS
    // ================================================

    return res.status(201).json({

      success: true,

      message: "Order placed successfully",

      order: result.order,

      amount: result.amount,

    });


  } catch (error) {

    console.error(
      "Place order error:",
      error
    );


    // ================================================
    // INSUFFICIENT BALANCE
    // ================================================

    if (
      error.message ===
      "Insufficient wallet balance"
    ) {

      return res.status(400).json({

        success: false,

        message:
          "Insufficient wallet balance",

      });

    }


    // ================================================
    // SERVICE NOT FOUND
    // ================================================

    if (
      error.message ===
      "Service not found"
    ) {

      return res.status(404).json({

        success: false,

        message: "Service not found",

      });

    }


    return res.status(500).json({

      success: false,

      message: error.message ||
        "Unable to place order",

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


    const orders =
      await getOrdersByUserId(userId);


    return res.status(200).json({

      success: true,

      orders,

    });


  } catch (error) {

    console.error(
      "Get orders error:",
      error
    );


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

    const orderId =
      Number(req.params.id);


    if (!userId) {

      return res.status(401).json({
        success: false,
        message: "User authentication required",
      });

    }


    if (!orderId) {

      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });

    }


    const order =
      await getOrderById(
        orderId,
        userId
      );


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

    console.error(
      "Get order error:",
      error
    );


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