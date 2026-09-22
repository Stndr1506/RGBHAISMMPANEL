import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/Funds.css";
// import Home from "../pages/Home";
import WhatsAppButton from "../components/WhatsappButton";

const quickAmounts = [100, 250, 500, 1000, 2500, 5000];

function Funds() {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [walletLoading, setWalletLoading] = useState(0);
  const [walletBalance, setWalletBalance] = useState(0);
  

  const handleAmount = (value) => {
    setAmount(value);
  };

  const verifyPaytmPayment = async (orderId, token) => {
    try {
      console.log("Verifying Paytm payment:", orderId);

      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/payments/paytm/verify`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            orderId,
          }),
        }
      );

      const data = await response.json();

      console.log("PAYTM VERIFY STATUS:", response.status);
      console.log("PAYTM VERIFY RESPONSE:", data);

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to verify Paytm payment."
        );
      }

      if (data.status === "SUCCESS") {
        alert(
          `Payment successful!\n₹${Number(data.amount).toFixed(
            2
          )} has been added to your wallet.`
        );

        // Optional:
        // Reload page so wallet balance is fetched again
        window.location.reload();

        return;
      }

      if (data.status === "PENDING") {
        alert(
          "Payment is still being processed. Please wait a moment and check your wallet again."
        );
        return;
      }

      if (data.status === "FAILED") {
        alert(
          data.message || "Paytm payment failed."
        );
        return;
      }

      alert(
        data.message || "Unable to determine payment status."
      );
    } catch (error) {
      console.error(
        "Paytm verification error:",
        error
      );

      alert(
        error.message ||
          "Unable to verify your Paytm payment."
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const numericAmount = Number(amount);

    if (!numericAmount || numericAmount < 10) {
      alert("Minimum amount is ₹10.");
      return;
    }

    if (numericAmount > 100000) {
      alert("Maximum amount is ₹100,000.");
      return;
    }

    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      if (!token) {
        alert("Please login again.");
        return;
      }

      console.log(
        "Creating Paytm payment for:",
        numericAmount
      );

      // ------------------------------------------------
      // STEP 1: CREATE PAYTM PAYMENT
      // ------------------------------------------------

      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/payments/create`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            amount: numericAmount,
            gateway: "PAYTM",
          }),
        }
      );

      console.log(
        "CREATE PAYMENT STATUS:",
        response.status
      );

      const data = await response.json();

      console.log(
        "CREATE PAYMENT RESPONSE:",
        data
      );

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to create Paytm payment."
        );
      }

      // ------------------------------------------------
      // STEP 2: CHECK PAYTM DATA
      // ------------------------------------------------

      if (
        !data.paytm ||
        !data.paytm.mid ||
        !data.paytm.orderId ||
        !data.paytm.txnToken
      ) {
        throw new Error(
          "Paytm transaction information is missing."
        );
      }

      const paytmOrderId = data.paytm.orderId;

      console.log(
        "Paytm Order ID:",
        paytmOrderId
      );

      // ------------------------------------------------
      // STEP 3: CHECK PAYTM CHECKOUT JS
      // ------------------------------------------------

      if (
        !window.Paytm ||
        !window.Paytm.CheckoutJS
      ) {
        throw new Error(
          "Paytm Checkout is not loaded."
        );
      }

      // ------------------------------------------------
      // STEP 4: PAYTM CHECKOUT CONFIG
      // ------------------------------------------------

      const config = {
        root: "",

        flow: "DEFAULT",

        data: {
          orderId: paytmOrderId,
          token: data.paytm.txnToken,
          tokenType: "TXN_TOKEN",
          amount: data.paytm.amount,
        },

        merchant: {
          mid: data.paytm.mid,
          name: "RGBHAI SMM Panel",
          redirect: false,
        },

        handler: {
          // --------------------------------------------
          // PAYTM EVENTS
          // --------------------------------------------

          notifyMerchant: function (
            eventName,
            eventData
          ) {
            console.log(
              "Paytm event:",
              eventName,
              eventData
            );
          },

          // --------------------------------------------
          // TRANSACTION STATUS
          // --------------------------------------------

          transactionStatus: async function (
            paymentStatus
          ) {
            console.log(
              "================================"
            );

            console.log(
              "PAYTM TRANSACTION STATUS:"
            );

            console.log(
              paymentStatus
            );

            console.log(
              "================================"
            );

            // ------------------------------------------
            // SUCCESS
            // ------------------------------------------

            if (
              paymentStatus &&
              paymentStatus.STATUS ===
                "TXN_SUCCESS"
            ) {
              alert(
                "Payment successful. Verifying payment..."
              );

              // IMPORTANT:
              // Do NOT credit wallet here.
              //
              // Backend will call Paytm Transaction
              // Status API and verify the payment.

              await verifyPaytmPayment(
                paytmOrderId,
                token
              );

              return;
            }

            // ------------------------------------------
            // FAILED
            // ------------------------------------------

            if (
              paymentStatus &&
              paymentStatus.STATUS ===
                "TXN_FAILURE"
            ) {
              console.error(
                "Paytm payment failed:",
                paymentStatus
              );

              alert(
                paymentStatus.RESPMSG ||
                  "Payment failed."
              );

              return;
            }

            // ------------------------------------------
            // PENDING
            // ------------------------------------------

            if (
              paymentStatus &&
              paymentStatus.STATUS ===
                "PENDING"
            ) {
              alert(
                "Payment is pending. We will verify the transaction shortly."
              );

              // We can call verification here too.
              await verifyPaytmPayment(
                paytmOrderId,
                token
              );

              return;
            }

            console.log(
              "Unknown Paytm payment status:",
              paymentStatus
            );
          },
        },
      };

      // ------------------------------------------------
      // STEP 5: INITIALIZE PAYTM CHECKOUT
      // ------------------------------------------------

      console.log(
        "Initializing Paytm Checkout..."
      );

      await window.Paytm.CheckoutJS.init(
        config
      );

      console.log(
        "Paytm Checkout initialized."
      );

      // ------------------------------------------------
      // STEP 6: OPEN PAYTM
      // ------------------------------------------------

      window.Paytm.CheckoutJS.invoke();

    } catch (error) {
      console.error(
        "Paytm payment error:",
        error
      );

      alert(
        error.message ||
          "Unable to start Paytm payment."
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchWalletBalance = async () => {
  try {
    setWalletLoading(true);

    const token = localStorage.getItem("token");

    console.log("Token exists:", !!token);

    const response = await axios.get(
      `${process.env.REACT_APP_API_URL}/api/wallet/balance`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log("Wallet response:", response.data);

    setWalletBalance(
      Number(response.data.balance) || 0
    );

  } catch (error) {
    console.error("Wallet error:", error);
    console.log("Status:", error.response?.status);
    console.log("Response:", error.response?.data);

    setWalletBalance(0);

  } finally {
    setWalletLoading(false);
  }
};

useEffect(() => {
  fetchWalletBalance();
}, []);


  return (
    <div className="funds-page">
      {/* <Home /> */}

      <main className="funds-container">
        <div className="funds-heading">
          <h1>Add Funds</h1>

          <p>
            Add money to your account securely
            using Paytm.
          </p>
        </div>

        <div className="funds-layout">
          <div className="payment-card">
            <div className="payment-card-heading">
              <div className="wallet-icon">
                ₹
              </div>

              <div>
                <h2>Add Balance</h2>

                <p>
                  Enter the amount you want
                  to add.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="fund-form-group">
                <label>Currency</label>

                <select
                  value="INR"
                  disabled
                >
                  <option value="INR">
                    INR - Indian Rupee ₹
                  </option>
                </select>
              </div>

              <div className="fund-form-group">
                <label>Amount</label>

                <div className="amount-input">
                  <span>₹</span>

                  <input
                    type="number"
                    value={amount}
                    onChange={(e) =>
                      handleAmount(
                        e.target.value
                      )
                    }
                    placeholder="Enter amount"
                    min="10"
                    max="100000"
                    step="1"
                  />
                </div>
              </div>

              <div className="quick-amounts">
                <label>
                  Quick Select
                </label>

                <div className="quick-buttons">
                  {quickAmounts.map(
                    (quickAmount) => (
                      <button
                        type="button"
                        key={quickAmount}
                        onClick={() =>
                          handleAmount(
                            quickAmount
                          )
                        }
                        className={
                          Number(amount) ===
                          quickAmount
                            ? "quick-btn selected"
                            : "quick-btn"
                        }
                      >
                        ₹{quickAmount}
                      </button>
                    )
                  )}
                </div>
              </div>

              <div className="payment-section">
                <label className="payment-label">
                  Payment Method
                </label>

                <div className="payment-methods">
                  <div className="payment-method selected">
                    <div className="method-icon">
                      ₹
                    </div>

                    <div className="method-content">
                      <strong>
                        Paytm
                      </strong>

                      <span>
                        Pay securely using
                        Paytm Checkout.
                      </span>
                    </div>

                    <div className="method-radio">
                      ✓
                    </div>
                  </div>
                </div>
              </div>

              <div className="payment-notice">
                <div className="notice-icon">
                  i
                </div>

                <p>
                  Your payment is processed
                  securely through Paytm.
                  Do not close the payment
                  window until the transaction
                  is completed.
                </p>
              </div>

              <button
                type="submit"
                className="add-money-button"
                disabled={loading}
              >
                {loading
                  ? "Creating Payment..."
                  : "Continue to Payment"}

                <span>→</span>
              </button>
            </form>
          </div>

          <aside className="funds-sidebar">
            <div className="current-balance-card">
              <div className="balance-card-top">
                <div>
                  <span>
                    Current Balance
                  </span>

                  <strong>
                    {walletLoading
                    ? "Loading..."
                    : `₹${walletBalance.toFixed(
                        2
                      )}`}
                  </strong>
                </div>

                <div className="big-wallet">
                  ₹
                </div>
              </div>

              <div className="balance-line" />

              <p>
                Your available balance can
                be used to place new orders.
              </p>
            </div>

            <div className="fund-summary-card">
              <h3>
                Payment Summary
              </h3>

              <div className="fund-summary-row">
                <span>Amount</span>

                <strong>
                  {amount
                    ? `₹${Number(
                        amount
                      ).toFixed(2)}`
                    : "₹0.00"}
                </strong>
              </div>

              <div className="fund-summary-row">
                <span>
                  Payment Method
                </span>

                <strong>
                  Paytm
                </strong>
              </div>

              <div className="fund-summary-row">
                <span>
                  Processing Fee
                </span>

                <strong className="green">
                  Free
                </strong>
              </div>

              <div className="summary-separator" />

              <div className="fund-total">
                <span>Total</span>

                <strong>
                  {amount
                    ? `₹${Number(
                        amount
                      ).toFixed(2)}`
                    : "₹0.00"}
                </strong>
              </div>
            </div>

            <div className="fund-help-card">
              <div className="help-title">
                <div className="help-question">
                  ?
                </div>

                <h3>Need Help?</h3>
              </div>

              <p>
                Having trouble adding funds?
                Contact our support team.
              </p>

              <a href="/support">
                Contact Support →
              </a>
            </div>
          </aside>
        </div>
      </main>
      <WhatsAppButton/>
    </div>
  );
}

export default Funds;