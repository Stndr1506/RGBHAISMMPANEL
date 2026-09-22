import React from "react";
import { FaWhatsapp } from "react-icons/fa";
import "../styles/WhatsappButton.css";

const WhatsAppButton = () => {
  const phoneNumber = "918376925292"; // Your WhatsApp number

  const message = "Hello, I need help with my order.";

  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
    message
  )}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="whatsapp-float"
      aria-label="Chat on WhatsApp"
    >
      <FaWhatsapp size={30} />
    </a>
  );
};

export default WhatsAppButton;