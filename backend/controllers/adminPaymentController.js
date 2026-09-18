const Payment = require("../models/adminPaymentModel");

// GET /api/payments
const getPayments = async (req, res) => {
  try {
    const payments = await Payment.getAllPayments();

    res.status(200).json({
      success: true,
      data: payments
    });

  } catch (error) {
    console.error("Get payments error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch payments",
      error: error.message
    });
  }
};


// GET /api/payments/:id
const getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;

    const payment = await Payment.getPaymentById(id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found"
      });
    }

    res.status(200).json({
      success: true,
      data: payment
    });

  } catch (error) {
    console.error("Get payment error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch payment",
      error: error.message
    });
  }
};


module.exports = {
  getPayments,
  getPaymentById
};
