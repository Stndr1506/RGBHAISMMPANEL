
const providerModel = require("../models/providerModel");

const {
  testProviderConnection,
  encryptProviderApiKey,
  decryptProviderApiKey,
  getProviderServices,
} = require("../services/providerService");

// Test provider connection without saving credentials
const testConnection = async (req, res) => {
  try {
    const { apiUrl, apiKey } = req.body;

    if (!apiUrl || !apiKey) {
      return res.status(400).json({
        success: false,
        message: "API URL and API key are required",
      });
    }

    const balance = await testProviderConnection(
      apiUrl.trim(),
      apiKey.trim()
    );

    return res.status(200).json({
      success: true,
      message: "Provider connection successful",
      balance,
    });
  } catch (error) {
    console.error("Provider connection test failed:", error.message);

    return res.status(400).json({
      success: false,
      message: error.message || "Provider connection failed",
    });
  }
};

// Save a new provider or update an existing provider
const saveProvider = async (req, res) => {
  try {
    const {
      providerName,
      apiUrl,
      apiKey,
      currency = "INR",
    } = req.body;

    if (
      !providerName ||
      !apiUrl ||
      !apiKey ||
      typeof providerName !== "string" ||
      typeof apiUrl !== "string" ||
      typeof apiKey !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Provider name, API URL and API key are required",
      });
    }

    const cleanName = providerName.trim();
    const cleanUrl = apiUrl.trim();
    const cleanKey = apiKey.trim();

    if (!cleanName || !cleanUrl || !cleanKey) {
      return res.status(400).json({
        success: false,
        message: "Provider details cannot be empty",
      });
    }

    // Test connection before saving
    await testProviderConnection(cleanUrl, cleanKey);

    // Encrypt API key before storing it
    const encryptedApiKey = encryptProviderApiKey(cleanKey);

    const existingProviders = await providerModel.getAllProviders();

    const existingProvider = existingProviders.find(
      (provider) =>
        provider.provider_name.toLowerCase() === cleanName.toLowerCase()
    );

    let provider;

    if (existingProvider) {
      provider = await providerModel.updateProvider({
        providerId: existingProvider.id,
        providerName: cleanName,
        apiUrl: cleanUrl,
        encryptedApiKey,
        currency,
      });
    } else {
      provider = await providerModel.createProvider({
        providerName: cleanName,
        apiUrl: cleanUrl,
        encryptedApiKey,
        currency,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Provider saved successfully",
      provider,
    });
  } catch (error) {
    console.error("Save provider failed:", error.message);

    return res.status(500).json({
      success: false,
      message: error.message || "Unable to save provider",
    });
  }
};

// Get all configured providers
const getProviders = async (req, res) => {
  try {
    const providers = await providerModel.getAllProviders();

    return res.status(200).json({
      success: true,
      providers,
    });
  } catch (error) {
    console.error("Get providers failed:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch providers",
    });
  }
};

// Fetch services from a saved provider
const fetchProviderServices = async (req, res) => {
  try {
    const providerId = Number(req.params.providerId);

    if (!Number.isInteger(providerId) || providerId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid provider ID",
      });
    }

    const provider = await providerModel.getProviderById(providerId);

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: "Provider not found",
      });
    }

    if (provider.status !== "Active") {
      return res.status(400).json({
        success: false,
        message: "Provider is inactive. Reconnect it first.",
      });
    }

    const apiKey = decryptProviderApiKey(provider.api_key_encrypted);

    const services = await getProviderServices(
      provider.api_url,
      apiKey
    );

    return res.status(200).json({
      success: true,
      total: services.length,
      services,
    });
  } catch (error) {
    console.error("Fetch provider services failed:", error.message);

    return res.status(500).json({
      success: false,
      message: error.message || "Unable to fetch provider services",
    });
  }
};

// Disconnect a provider
const disconnectProvider = async (req, res) => {
  try {
    const providerId = Number(req.params.providerId);

    if (!Number.isInteger(providerId) || providerId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid provider ID",
      });
    }

    const provider = await providerModel.getProviderById(providerId);

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: "Provider not found",
      });
    }

    if (provider.status === "Inactive") {
      return res.status(400).json({
        success: false,
        message: "Provider is already disconnected",
      });
    }

    const updatedProvider =
      await providerModel.disconnectProvider(providerId);

    return res.status(200).json({
      success: true,
      message: "Provider disconnected successfully",
      provider: updatedProvider,
    });
  } catch (error) {
    console.error("Disconnect provider failed:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to disconnect provider",
    });
  }
};

module.exports = {
  testConnection,
  saveProvider,
  getProviders,
  fetchProviderServices,
  disconnectProvider,
};
