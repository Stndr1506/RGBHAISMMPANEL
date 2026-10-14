const {
  getWalletByUserId,
  updateWalletBalance,
} = require("../models/walletModel");

const updateUserFunds = async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const { amount, action, reason } = req.body;

    // Validate user ID
    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID.",
      });
    }

    // Validate amount
    const fundAmount = Number(amount);

    if (
      !Number.isFinite(fundAmount) ||
      fundAmount <= 0 ||
      !Number.isSafeInteger(Math.round(fundAmount * 100))
    ) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid amount greater than zero.",
      });
    }

    // Validate action
    const fundAction = String(action || "").toUpperCase();

    if (!["ADD", "DEDUCT"].includes(fundAction)) {
      return res.status(400).json({
        success: false,
        message: "Action must be ADD or DEDUCT.",
      });
    }

    const wallet = await getWalletByUserId(userId);

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found for this user.",
      });
    }

    // Update the existing wallet balance
    const updated = await updateWalletBalance(
      userId,
      fundAmount,
      fundAction
    );

    if (!updated) {
      const currentWallet = await getWalletByUserId(userId);

      if (!currentWallet) {
        return res.status(404).json({
          success: false,
          message: "Wallet not found for this user.",
        });
      }

      return res.status(400).json({
        success: false,
        message: "Insufficient wallet balance for this deduction.",
      });
    }

    const updatedWallet = await getWalletByUserId(userId);

    return res.status(200).json({
      success: true,
      message:
        fundAction === "ADD"
          ? "Funds added successfully."
          : "Funds deducted successfully.",
      wallet: {
        user_id: updatedWallet.user_id,
        balance: Number(updatedWallet.balance),
        currency: updatedWallet.currency,
      },
      action: fundAction,
      amount: fundAmount,
      reason: reason || null,
      admin_id: req.user.id,
    });
  } catch (error) {
    console.error("Admin update user funds error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update user funds.",
    });
  }
};

module.exports = {
  updateUserFunds,
};