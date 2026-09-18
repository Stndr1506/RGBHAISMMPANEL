const razorpay = require("../config/razorpay");

const {
  initiatePayment,
  fetchPaymentOptions,
  getPaymentStatus,
} = require("../config/paytm");

const {
  createPayment,
  verifyAndCreditWallet,
  getPaymentByGatewayOrderId,
} = require("../models/paymentModel");


const createDeposit = async (req, res) => {
  try {
    // ==================================
    // USER
    // ==================================

    const userId = req.user.id;

    // ==================================
    // AMOUNT
    // ==================================

    const amount = Number(req.body.amount);

    // ==================================
    // GATEWAY
    // ==================================

    const gateway = String(
      req.body.gateway || "RAZORPAY"
    ).toUpperCase();


    // ==================================
    // VALIDATE GATEWAY
    // ==================================

    if (
      !["RAZORPAY", "PAYTM"].includes(gateway)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment gateway",
      });
    }


    // ==================================
    // VALIDATE AMOUNT
    // ==================================

    if (!Number.isFinite(amount)) {
      return res.status(400).json({
        success: false,
        message: "Invalid amount",
      });
    }

    if (amount < 10) {
      return res.status(400).json({
        success: false,
        message: "Minimum deposit amount is ₹10",
      });
    }

    if (amount > 100000) {
      return res.status(400).json({
        success: false,
        message:
          "Maximum deposit amount is ₹100,000",
      });
    }


    // ==================================
    // RAZORPAY
    // ==================================

    if (gateway === "RAZORPAY") {

      const amountInPaise =
        Math.round(amount * 100);


      // ----------------------------------
      // CREATE RAZORPAY ORDER
      // ----------------------------------

      const razorpayOrder =
        await razorpay.orders.create({
          amount: amountInPaise,
          currency: "INR",

          receipt:
            `wallet_${userId}_${Date.now()}`,
        });


      // ----------------------------------
      // SAVE PAYMENT
      // ----------------------------------

      const payment =
        await createPayment({
          userId,
          amount,
          gateway: "RAZORPAY",
          gatewayOrderId:
            razorpayOrder.id,
        });


      // ----------------------------------
      // RESPONSE
      // ----------------------------------

      return res.status(201).json({
        success: true,

        message:
          "Razorpay payment order created",

        payment: {
          id: payment.id,

          amount: payment.amount,

          currency: "INR",

          gateway: payment.gateway,

          gatewayOrderId:
            payment.gateway_order_id,

          status: payment.status,
        },

        razorpay: {
          keyId:
            process.env.RAZORPAY_KEY_ID,

          orderId:
            razorpayOrder.id,

          amount:
            razorpayOrder.amount,

          currency:
            razorpayOrder.currency,
        },
      });
    }


    // ==================================
    // PAYTM
    // ==================================

    if (gateway === "PAYTM") {

      // ----------------------------------
      // CREATE PAYTM ORDER ID
      // ----------------------------------

      const paytmOrderId =
        `PAYTM_${userId}_${Date.now()}`;


      // ----------------------------------
      // INITIATE PAYTM PAYMENT
      // ----------------------------------

      const paytmResponse =
        await initiatePayment({
          orderId: paytmOrderId,

          amount,

          customerId: userId,
        });


      // ----------------------------------
      // LOG PAYTM RESPONSE
      // ----------------------------------

      console.log(
        "========== PAYTM RESPONSE =========="
      );

      console.log(
        JSON.stringify(
          paytmResponse,
          null,
          2
        )
      );

      console.log(
        "====================================="
      );


      // ----------------------------------
      // GET PAYTM BODY
      // ----------------------------------

      const paytmBody =
        paytmResponse?.responseObject?.body;


      const resultInfo =
        paytmBody?.resultInfo;


      // ----------------------------------
      // CHECK PAYTM RESPONSE
      // ----------------------------------

      if (
        resultInfo?.resultStatus !== "S" ||
        !paytmBody?.txnToken
      ) {

        console.error(
          "PAYTM INITIATE FAILED:",
          JSON.stringify(
            paytmResponse,
            null,
            2
          )
        );


        return res.status(400).json({
          success: false,

          message:
            resultInfo?.resultMsg ||
            "Unable to initiate Paytm payment",

          paytm: {
            resultStatus:
              resultInfo?.resultStatus ||
              null,

            resultCode:
              resultInfo?.resultCode ||
              null,

            resultMsg:
              resultInfo?.resultMsg ||
              null,
          },
        });
      }


      // ----------------------------------
      // PAYTM INITIATION SUCCESS
      // ----------------------------------

      console.log(
        "PAYTM INITIATE SUCCESS"
      );

      console.log(
        "Paytm Order ID:",
        paytmOrderId
      );

      console.log(
        "Paytm Txn Token:",
        paytmBody.txnToken
      );

      const paymentOptions =
  await fetchPaymentOptions({
    orderId: paytmOrderId,
    txnToken: paytmBody.txnToken,
  });

console.log(
  "PAYMENT OPTIONS:",
  JSON.stringify(
    paymentOptions,
    null,
    2
  )
);

      // ----------------------------------
      // SAVE PAYMENT
      // ----------------------------------

      const payment =
        await createPayment({
          userId,

          amount,

          gateway: "PAYTM",

          gatewayOrderId:
            paytmOrderId,
        });


      // ----------------------------------
      // RETURN PAYTM CHECKOUT DATA
      // ----------------------------------

      return res.status(201).json({
        success: true,

        message:
          "Paytm payment order created",

        payment: {
          id: payment.id,

          amount: payment.amount,

          currency: "INR",

          gateway: payment.gateway,

          gatewayOrderId:
            payment.gateway_order_id,

          status: payment.status,
        },

        paytm: {
          mid:
            process.env.PAYTM_MID,

          orderId:
            paytmOrderId,

          txnToken:
            paytmBody.txnToken,

          amount:
            amount.toFixed(2),

          environment:
            process.env.PAYTM_ENV ===
            "production"
              ? "production"
              : "staging",
        },
      });
    }


    // ==================================
    // FALLBACK
    // ==================================

    return res.status(400).json({
      success: false,
      message: "Payment gateway not handled",
    });

  } catch (error) {

    // ==================================
    // ERROR
    // ==================================

    console.error(
      "Create deposit error:",
      error.response?.data ||
      error.message ||
      error
    );


    return res.status(500).json({
      success: false,

      message:
        "Unable to create payment order",
    });
  }
};


const verifyPaytmPayment = async (req, res) => {
  try {

    // ==========================================
    // USER
    // ==========================================

    const userId = req.user.id;

    // ==========================================
    // ORDER ID
    // ==========================================

    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Paytm order ID is required",
      });
    }

    console.log(
      "VERIFYING PAYTM ORDER:",
      orderId
    );

    // ==========================================
    // FIND OUR PAYMENT
    // ==========================================

    const payment =
      await getPaymentByGatewayOrderId(
        orderId
      );

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    // ==========================================
    // SECURITY
    // ==========================================

    if (
      Number(payment.user_id) !==
      Number(userId)
    ) {
      return res.status(403).json({
        success: false,
        message: "Payment does not belong to user",
      });
    }

    // ==========================================
    // ALREADY SUCCESS
    // ==========================================

    if (payment.status === "SUCCESS") {
      return res.json({
        success: true,
        message: "Payment already processed",
        status: "SUCCESS",
        walletCredited: false,
      });
    }

    // ==========================================
    // ASK PAYTM
    // ==========================================

    const paytmResponse =
      await getPaymentStatus(orderId);

    const paytmBody =
      paytmResponse?.responseObject?.body;

    const resultInfo =
      paytmBody?.resultInfo;

    console.log(
      "PAYTM STATUS RESULT:",
      JSON.stringify(
        paytmResponse,
        null,
        2
      )
    );

    // ==========================================
    // PAYMENT SUCCESS
    // ==========================================

    if (
      resultInfo?.resultStatus ===
      "TXN_SUCCESS"
    ) {

      const transactionId =
        paytmBody?.txnId;

      const paytmAmount =
        Number(paytmBody?.txnAmount);

      // ----------------------------------------
      // Verify amount
      // ----------------------------------------

      if (
        !Number.isFinite(paytmAmount) ||
        paytmAmount.toFixed(2) !==
          Number(payment.amount).toFixed(2)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Payment amount mismatch",
        });
      }

      // ----------------------------------------
      // Credit wallet atomically
      // ----------------------------------------

      const result =
        await verifyAndCreditWallet({
          paymentId: payment.id,
          userId,
          amount: payment.amount,
          transactionId,
        });

      if (result.alreadyProcessed) {
        return res.json({
          success: true,
          message:
            "Payment already processed",
          status: "SUCCESS",
          walletCredited: false,
        });
      }

      return res.json({
        success: true,

        message:
          "Payment verified and wallet credited",

        status: "SUCCESS",

        amount:
          Number(payment.amount),

        transactionId,

        walletCredited: true,
      });
    }

    // ==========================================
    // PAYMENT FAILED
    // ==========================================

    if (
      resultInfo?.resultStatus ===
      "TXN_FAILURE"
    ) {

      return res.status(400).json({
        success: false,

        message:
          resultInfo?.resultMsg ||
          "Paytm payment failed",

        status: "FAILED",
      });
    }

    // ==========================================
    // PENDING
    // ==========================================

    return res.json({
      success: true,

      message:
        "Payment is still pending",

      status: "PENDING",
    });

  } catch (error) {

    console.error(
      "Verify Paytm payment error:",
      error.response?.data ||
      error.message ||
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to verify Paytm payment",
    });
  }
};


module.exports = {
  createDeposit,
  verifyPaytmPayment,
};