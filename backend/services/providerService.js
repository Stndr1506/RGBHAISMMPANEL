
const axios = require("axios");

const {
  encrypt,
  decrypt,
} = require("../utils/providerEncryption");

// Send a request to an external SMM provider
const sendProviderRequest = async (apiUrl, apiKey, payload) => {
  if (!apiUrl || typeof apiUrl !== "string") {
    throw new Error("Provider API URL is required");
  }

  if (!apiKey || typeof apiKey !== "string") {
    throw new Error("Provider API key is required");
  }

  let parsedUrl;

  try {
    parsedUrl = new URL(apiUrl);
  } catch {
    throw new Error("Invalid provider API URL");
  }

  if (!["https:", "http:"].includes(parsedUrl.protocol)) {
    throw new Error("Invalid provider API protocol");
  }

  let response;

  try {
    response = await axios.post(
      parsedUrl.toString(),
      {
        key: apiKey,
        ...payload,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 20000,
      }
    );
  } catch (axiosError) {
    const statusCode = axiosError.response?.status;
    const responseData = axiosError.response?.data;

    const providerMessage =
      responseData?.error ||
      responseData?.message ||
      axiosError.message ||
      "Provider request failed";

    const error = new Error(
      `Provider HTTP ${statusCode || "error"}: ${String(providerMessage)}`
    );

    error.providerHttpStatus = statusCode;

    // A 401 means the provider rejected authentication.
    // The existing createOrder() refund branch handles providerRejected.
    if (statusCode === 401) {
      error.providerRejected = true;
    }

    throw error;
  }

  if (response.data?.error) {
    const error = new Error(String(response.data.error));
    error.providerRejected = true;
    throw error;
  }

  return response.data;
};
// Test provider connection
const testProviderConnection = async (apiUrl, apiKey) => {
  return sendProviderRequest(apiUrl, apiKey, {
    action: "balance",
  });
};

// Fetch services from provider
const getProviderServices = async (apiUrl, apiKey) => {
  const data = await sendProviderRequest(apiUrl, apiKey, {
    action: "services",
  });

  if (!Array.isArray(data)) {
    throw new Error("Invalid provider services response");
  }

  return data;
};

// Submit an order to provider
const addProviderOrder = async (apiUrl, apiKey, orderData) => {
  return sendProviderRequest(apiUrl, apiKey, {
    action: "add",
    ...orderData,
  });
};

// Get external order status
const getProviderOrderStatus = async (
  apiUrl,
  apiKey,
  providerOrderId
) => {
  return sendProviderRequest(apiUrl, apiKey, {
    action: "status",
    order: providerOrderId,
  });
};

// API key encryption/decryption
const encryptProviderApiKey = (apiKey) => encrypt(apiKey);

const decryptProviderApiKey = (encryptedApiKey) =>
  decrypt(encryptedApiKey);

module.exports = {
  sendProviderRequest,
  testProviderConnection,
  getProviderServices,
  addProviderOrder,
  getProviderOrderStatus,
  encryptProviderApiKey,
  decryptProviderApiKey,
};
