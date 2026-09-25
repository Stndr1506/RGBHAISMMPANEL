import React, { useState } from "react";
import "../styles/Affiliates.css";
import WhatsAppButton from "../components/WhatsappButton";

function Affiliates() {
  const [copied, setCopied] = useState(false);

  const referralLink = "https://rgbhaismm.com/ref/001kf";

  const copyReferralLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error("Copy failed:", error);
    }
  };

  return (
    <div className="affiliate-page">

      {/* =========================================
          NAVBAR
      ========================================= */}

      <header className="affiliate-navbar">

        <div className="affiliate-logo">

        </div>

      </header>


      {/* =========================================
          MAIN
      ========================================= */}

      <main className="affiliate-container">


        {/* =========================================
            REFERRAL LINK
        ========================================= */}

        <section className="affiliate-card referral-card">

          <h3>Referral link</h3>

          <div className="referral-link-row">

            <span className="referral-link">
              {referralLink}
            </span>

            <button
              className="copy-referral-btn"
              onClick={copyReferralLink}
              title="Copy referral link"
            >
              {copied ? "✓" : "▣"}
            </button>

          </div>

          {copied && (
            <span className="copied-message">
              Referral link copied!
            </span>
          )}

        </section>


        {/* =========================================
            COMMISSION
        ========================================= */}

        <section className="affiliate-card">

          <h3>Commission rate</h3>

          <p>2%</p>

        </section>


        {/* =========================================
            MINIMUM PAYOUT
        ========================================= */}

        <section className="affiliate-card">

          <h3>Minimum payout</h3>

          <p>₹100.00</p>

        </section>


        {/* =========================================
            STATISTICS
        ========================================= */}

        <section className="affiliate-table-card">

          <div className="affiliate-table-wrapper">

            <table className="affiliate-stats-table">

              <thead>
                <tr>
                  <th>Visits</th>
                  <th>Registrations</th>
                  <th>Referrals</th>
                  <th>Conversion rate</th>
                  <th>Total earnings</th>
                  <th>Available</th>
                </tr>
              </thead>

              <tbody>
                <tr>
                  <td>0</td>
                  <td>0</td>
                  <td>0</td>
                  <td>0.00%</td>
                  <td>₹0.00</td>
                  <td>₹0.00</td>
                </tr>
              </tbody>

            </table>

          </div>

        </section>


        {/* =========================================
            PAYOUT HISTORY
        ========================================= */}

        <section className="affiliate-table-card payout-card">

          <div className="payout-table-wrapper">

            <table className="payout-table">

              <thead>
                <tr>
                  <th>Payout date</th>
                  <th>Payout amount</th>
                  <th>Payout status</th>
                </tr>
              </thead>

              <tbody>

                <tr>
                  <td colSpan="3">
                    <div className="no-payouts">
                      No payouts yet
                    </div>
                  </td>
                </tr>

              </tbody>

            </table>

          </div>

        </section>

      </main>
    <WhatsAppButton/>

    </div>
  );
}

export default Affiliates;