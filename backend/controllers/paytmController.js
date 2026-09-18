const axios = require("axios");
const PaytmChecksum = require("paytmchecksum");

const PAYTM_CONFIG = require("../config/paytm");

const createPaytmPayment = async (req, res) => {
  try {
    const userId = req.user.id;

    const amount = Number(req.body.amount);

    // Validate amount
    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid amount",
      });
    }

    // Example order ID
    const orderId = `SMM_${userId}_${Date.now()}`;

    const amountString = amount.toFixed(2);

    const body = {
      requestType: "Payment",
      mid: PAYTM_CONFIG.mid,
      websiteName: PAYTM_CONFIG.website,

      orderId: orderId,

      txnAmount: {
        value: amountString,
        currency: "INR",
      },

      userInfo: {
        custId: String(userId),
      },

      callbackUrl: PAYTM_CONFIG.callbackUrl,
    };

    const bodyString = JSON.stringify(body);

    const checksum = await PaytmChecksum.generateSignature(
      bodyString,
      PAYTM_CONFIG.merchantKey
    );

    const request = {
      body,
      head: {
        signature: checksum,
      },
    };

    console.log("PAYTM REQUEST:");
    console.log(JSON.stringify(request, null, 2));

    const response = await axios.post(
      `${PAYTM_CONFIG.initiateUrl}?mid=${PAYTM_CONFIG.mid}&orderId=${orderId}`,
      request,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    console.log("PAYTM RESPONSE:");
    console.log(JSON.stringify(response.data, null, 2));

    return res.status(200).json({
      success: true,
      orderId,
      amount: amountString,
      data: response.data,
    });
  } catch (error) {
    console.error(
      "PAYTM CREATE PAYMENT ERROR:",
      error.response?.data || error.message
    );

    return res.status(500).json({
      success: false,
      message: "Unable to create Paytm payment",
      error: error.response?.data || error.message,
    });
  }
};

module.exports = {
  createPaytmPayment,
};