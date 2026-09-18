const {
  getWalletByUserId,
} = require("../models/walletModel");

const getWallet = async (req, res) => {
  try {
    const userId = req.user.id;

    const wallet = await getWalletByUserId(userId);

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found",
      });
    }

    return res.status(200).json({
      success: true,
      wallet: {
        id: wallet.id,
        balance: wallet.balance,
        currency: wallet.currency,
      },
    });

  } catch (error) {
    console.error("Get wallet error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const {
  getWalletBalanceByUserId,
} = require("../models/walletModel");

const getWalletBalance = async (req, res) => {
  try {

    console.log("REQ.USER:", req.user);

    const userId = req.user?.id;

    console.log("USER ID:", userId);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User ID not found",
      });
    }

    const wallet = await getWalletByUserId(userId);

    console.log("WALLET:", wallet);

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found for this user",
      });
    }

    return res.status(200).json({
      success: true,
      balance: Number(wallet.balance),
      currency: wallet.currency,
    });

  } catch (error) {

    console.error("WALLET ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getWallet,
  getWalletBalance,
};
