const axios = require("axios");
const Paytm = require("paytm-pg-node-sdk");

const environment =
  process.env.PAYTM_ENV === "production"
    ? Paytm.LibraryConstants.PRODUCTION_ENVIRONMENT
    : Paytm.LibraryConstants.STAGING_ENVIRONMENT;

const mid = process.env.PAYTM_MID;
const key = process.env.PAYTM_MERCHANT_KEY;
const website = process.env.PAYTM_WEBSITE;


console.log("========== PAYTM CONFIG ==========");
console.log("Environment:", environment);
console.log("MID:", mid ? "LOADED" : "MISSING");
console.log("Key:", key ? "LOADED" : "MISSING");
console.log("Website:", website);
console.log("===================================");

if (!website) {
  throw new Error("PAYTM_WEBSITE is missing");
}

if (!mid) {
  throw new Error("PAYTM_MID is missing");
}

if (!key) {
  throw new Error("PAYTM_MERCHANT_KEY is missing");
}

Paytm.MerchantProperties.setCallbackUrl(
  process.env.PAYTM_CALLBACK_URL
);

Paytm.MerchantProperties.initialize(
  environment,
  mid,
  key,
  website
);

const initiatePayment = async ({
  orderId,
  amount,
  customerId,
}) => {
  const channelId = Paytm.EChannelId.WEB;

  const txnAmount =
    Paytm.Money.constructWithCurrencyAndValue(
      Paytm.EnumCurrency.INR,
      Number(amount).toFixed(2)
    );

  const userInfo =
    new Paytm.UserInfo(String(customerId));

  const paymentDetailBuilder =
    new Paytm.PaymentDetailBuilder(
      channelId,
      String(orderId),
      txnAmount,
      userInfo
    );
//     paymentDetailBuilder.setEnablePaymentMode([
//   {
//     mode: "UPI"
//   }
// ]);
//     paymentDetailBuilder.setEnablePaymentMode([
//   {
//     mode: "UPI",
//     channels: ["UPIPUSH"],
//   },
// ]);

  const paymentDetail =
    paymentDetailBuilder.build();

  console.log(
    "PAYTM PAYMENT DETAIL:",
    JSON.stringify(paymentDetail, null, 2)
  );

  const response =
    await Paytm.Payment.createTxnToken(
      paymentDetail
    );

  console.log(
    "PAYTM RESPONSE:",
    JSON.stringify(response, null, 2)
  );

  return response;
};

const fetchPaymentOptions = async ({
  orderId,
  txnToken,
}) => {
  const mid = process.env.PAYTM_MID;

  const url =
    `https://securestage.paytmpayments.com/theia/api/v2/fetchPaymentOptions` +
    `?mid=${encodeURIComponent(mid)}` +
    `&orderId=${encodeURIComponent(orderId)}`;

  const requestBody = {
    head: {
      tokenType: "TXN_TOKEN",
      token: txnToken,
    },

    body: {
      mid,
      orderId,
      returnToken: true,
    },
  };

  console.log("========== FETCH PAYMENT OPTIONS ==========");

  const response = await axios.post(
    url,
    requestBody,
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  console.log(
    JSON.stringify(response.data, null, 2)
  );

  console.log("===========================================");

  return response.data;
};

const getPaymentStatus = async (orderId) => {
  const paymentStatusDetailBuilder =
    new Paytm.PaymentStatusDetailBuilder(
      String(orderId)
    );

  const paymentStatusDetail =
    paymentStatusDetailBuilder
      .setReadTimeout(80000)
      .build();

  const response =
    await Paytm.Payment.getPaymentStatus(
      paymentStatusDetail
    );

  console.log(
    "========== PAYTM PAYMENT STATUS =========="
  );

  console.log(
    JSON.stringify(response, null, 2)
  );

  console.log(
    "==========================================="
  );

  return response;
};

module.exports = {
  initiatePayment,
  fetchPaymentOptions,
  getPaymentStatus
};