
import React, { useState } from "react";
import Navbar from "../components/Navbar";
import paymentQr from '../assets/payment-qr.jpeg';
import "../styles/DirectFunds.css";

const WHATSAPP_NUMBER = "918376925292"; // Replace with your WhatsApp number
const QR_IMAGE = paymentQr; // Put your QR image in the public folder

const PAYMENT_METHODS = [
  { label: "PhonePe", value: "PhonePe", icon: "🟣" },
  { label: "Google Pay", value: "Google Pay", icon: "🔵" },
  { label: "Paytm", value: "Paytm", icon: "🔷" },
];

const DirectFunds = () => {
  const [paymentMethod, setPaymentMethod] = useState("PhonePe");

  const message = `Hello RG Bhai Digital Promotion,

I have completed my payment through ${paymentMethod}.

My Panel Username: [Enter your username]
Payment Amount: ₹[Enter amount]

I am sending my payment screenshot for verification. Please add the funds to my panel wallet.

Thank you.`;

  const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

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

          <div className="direct-funds-method">
            <label htmlFor="paymentMethod">
               Payment Methods
            </label>

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
              <img
                src={QR_IMAGE}
                alt={`${paymentMethod} payment QR code`}
                className="direct-funds-qr"
              />
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
              +{WHATSAPP_NUMBER}
            </p>

            <a
              className="direct-funds-whatsapp-button"
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(event) => {
                if (WHATSAPP_NUMBER.includes("X")) {
                  event.preventDefault();
                  alert(
                    "Please add your WhatsApp number in DirectFunds.jsx first."
                  );
                }
              }}
            >
              <span></span>
              Send Screenshot on WhatsApp
            </a>
          </div>

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
