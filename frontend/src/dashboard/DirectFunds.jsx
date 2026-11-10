
import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import "../styles/DirectFunds.css";

const API_URL = (
  process.env.REACT_APP_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

const PAYMENT_METHODS = [
  { label: "PhonePe", value: "PhonePe", icon: "🟣" },
  { label: "Google Pay", value: "Google Pay", icon: "🔵" },
  { label: "Paytm", value: "Paytm", icon: "🔷" },
];

const DirectFunds = () => {
  const [paymentMethod, setPaymentMethod] = useState("PhonePe");

  const [settings, setSettings] = useState({
    whatsapp_number: "",
    qr_image_path: "",
  });

  const [loading, setLoading] = useState(true);
  const [settingsError, setSettingsError] = useState("");

  // Fetch latest admin settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch(`${API_URL}/api/admin-settings`);

        if (!response.ok) {
          throw new Error("Unable to fetch payment settings");
        }

        const data = await response.json();

        if (data.success && data.settings) {
          setSettings({
            whatsapp_number: data.settings.whatsapp_number || "",
            qr_image_path: data.settings.qr_image_path || "",
          });
        } else {
          throw new Error("Payment settings not found");
        }
      } catch (error) {
        console.error("Fetch settings error:", error);
        setSettingsError("Unable to load payment details. Please refresh.");
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // Build QR image URL
  const qrImageUrl = settings.qr_image_path
    ? settings.qr_image_path.startsWith("http")
      ? settings.qr_image_path
      : `${API_URL}${settings.qr_image_path.startsWith("/") ? "" : "/"}${settings.qr_image_path}`
    : "";

  const whatsappNumber = settings.whatsapp_number;

  const message = `Hello RG Bhai Digital Promotion,

I have completed my payment through ${paymentMethod}.

My Panel Username: [Enter your username]
Payment Amount: ₹[Enter amount]

I am sending my payment screenshot for verification. Please add the funds to my panel wallet.

Thank you.`;

  const whatsappLink = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`
    : "#";

  return (
    <div className="page-with-navbar direct-funds-layout">
      <Navbar />

      <main className="direct-funds-page">
        <section className="direct-funds-card">

          <div className="direct-funds-heading">
            <span className="direct-funds-icon">💳</span>
            <h1>Add Funds</h1>
            <p>Add money to your RGBHAI SMM PANEL wallet</p>
          </div>

          {loading ? (
            <p>Loading payment details...</p>
          ) : settingsError ? (
            <p>{settingsError}</p>
          ) : (
            <>
              <div className="direct-funds-method">
                <label htmlFor="paymentMethod">Payment Methods</label>

                <select
                  id="paymentMethod"
                  value={paymentMethod}
                  onChange={(event) =>
                    setPaymentMethod(event.target.value)
                  }
                >
                  {PAYMENT_METHODS.map((method) => (
                    <option key={method.value} value={method.value}>
                      {method.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="direct-funds-qr-section">
                <p className="direct-funds-scan-title">
                  Scan QR Code to Pay
                </p>

                <div className="direct-funds-qr-frame">
                  {qrImageUrl ? (
                    <img
                      src={qrImageUrl}
                      alt={`${paymentMethod} payment QR code`}
                      className="direct-funds-qr"
                    />
                  ) : (
                    <p>QR code is not available.</p>
                  )}
                </div>

                <p className="direct-funds-secure">
                  Pay using {paymentMethod}
                </p>
              </div>

              <div className="direct-funds-instructions">
                <h2>💳 Add Funds to Your Panel</h2>

                <ol>
                  <li>QR Code स्कैन करके पेमेंट करें।</li>
                  <li>पेमेंट का Screenshot WhatsApp पर भेजें।</li>
                  <li>अपना Panel Username भी भेजें।</li>
                  <li>
                    पेमेंट Verify होने पर आपके Username में Funds Add
                    कर दिए जाएंगे।
                  </li>
                  <li>फिर आप आसानी से अपना Order लगा सकते हैं।</li>
                </ol>
              </div>

              <div className="direct-funds-whatsapp">
                <p className="direct-funds-contact-label">
                  Send your payment screenshot on WhatsApp
                </p>

                <p className="direct-funds-phone">
                  {whatsappNumber ? `+${whatsappNumber}` : "Number not available"}
                </p>

                <a
                  className="direct-funds-whatsapp-button"
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(event) => {
                    if (!whatsappNumber) {
                      event.preventDefault();
                      alert("WhatsApp number is not available.");
                    }
                  }}
                >
                  <span></span>
                  Send Screenshot on WhatsApp
                </a>
              </div>
            </>
          )}

          <div className="direct-funds-brand">
            <h3>RG Bhai Digital Promotion</h3>
            <p>Fast <span>•</span> Easy <span>•</span> Secure</p>
          </div>

        </section>
      </main>
    </div>
  );
};

export default DirectFunds;
