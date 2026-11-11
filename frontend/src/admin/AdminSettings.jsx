
import React, { useEffect, useState } from "react";
import axios from "axios";
import AdminNavbar from "../components/AdminNavbar";
import "../styles/AdminSettings.css";

const API_URL = (
  process.env.REACT_APP_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

const AdminSettings = () => {
  const [whatsappNumber, setWhatsappNumber] = useState("");

  const [qrImage, setQrImage] = useState(null);
  const [qrPreview, setQrPreview] = useState("");

  const [logoImage, setLogoImage] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loginHeading, setLoginHeading] = useState(
  "RG Bhai Main Google Ads Youtube Views Provider: #1 Main SMM Service Provider"
);

const [loginDescription, setLoginDescription] = useState(
  "SMM Panel is an online store where people can buy likes, followers, views, YouTube views etc. providing you with unbeatable prices for all of your social marketing need."
);

  // ==================================
  // FETCH CURRENT SETTINGS
  // ==================================

  const fetchSettings = async () => {
    try {
      setLoading(true);

      const response = await axios.get(
        `${API_URL}/api/admin-settings`
      );

      const settings = response.data.settings;

      setWhatsappNumber(settings.whatsapp_number || "");
      setLoginHeading(
  settings.login_heading ||
  "RG Bhai Main Google Ads Youtube Views Provider: #1 Main SMM Service Provider"
);

setLoginDescription(
  settings.login_description ||
  "SMM Panel is an online store where people can buy likes, followers, views, YouTube views etc. providing you with unbeatable prices for all of your social marketing need."
);

      setQrPreview(
        settings.qr_image_path
          ? `${API_URL}${settings.qr_image_path}`
          : ""
      );

      setLogoPreview(
        settings.logo_image_path
          ? `${API_URL}${settings.logo_image_path}`
          : ""
      );

    } catch (error) {
      console.error(
        "Fetch settings error:",
        error.response?.data || error
      );

      alert("Unable to load admin settings.");

    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // ==================================
  // VALIDATE IMAGE
  // ==================================

  const validateImage = (file) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      alert("Please select JPG, PNG or WEBP image.");
      return false;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image size must be less than 5 MB.");
      return false;
    }

    return true;
  };

  // ==================================
  // SELECT QR IMAGE
  // ==================================

  const handleQrChange = (event) => {
    const file = event.target.files[0];

    if (!file) return;

    if (!validateImage(file)) {
      event.target.value = "";
      return;
    }

    setQrImage(file);
    setQrPreview(URL.createObjectURL(file));
  };

  // ==================================
  // SELECT LOGO IMAGE
  // ==================================

  const handleLogoChange = (event) => {
    const file = event.target.files[0];

    if (!file) return;

    if (!validateImage(file)) {
      event.target.value = "";
      return;
    }

    setLogoImage(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  // ==================================
  // SAVE SETTINGS
  // ==================================

  const handleSave = async (event) => {
    event.preventDefault();

    const cleanNumber = whatsappNumber.replace(/\D/g, "");

    if (!/^\d{10,15}$/.test(cleanNumber)) {
      alert(
        "Enter a valid WhatsApp number with country code."
      );
      return;
    }

    try {
      setSaving(true);

      const token = localStorage.getItem("token");

      if (!token) {
        alert("Session expired. Please login again.");
        return;
      }

      const formData = new FormData();

      formData.append("whatsappNumber", cleanNumber);
      formData.append("loginHeading", loginHeading);
formData.append("loginDescription", loginDescription);

      if (qrImage) {
        formData.append("qrImage", qrImage);
      }

      if (logoImage) {
        formData.append("logoImage", logoImage);
      }

      const response = await axios.put(
        `${API_URL}/api/admin-settings`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert(response.data.message || "Settings updated successfully.");

      setQrImage(null);
      setLogoImage(null);

      await fetchSettings();

    } catch (error) {
      console.error(
        "Save settings error:",
        error.response?.data || error
      );

      alert(
        error.response?.data?.message ||
        "Unable to save settings."
      );

    } finally {
      setSaving(false);
    }
  };

  // ==================================
  // LOADING
  // ==================================

  if (loading) {
    return (
      <div className="admin-settings-layout">
        <AdminNavbar />
        <div className="admin-settings-page">
          Loading settings...
        </div>
      </div>
    );
  }

  // ==================================
  // UI
  // ==================================

  return (
    <div className="admin-settings-layout">
      <AdminNavbar />

      <main className="admin-settings-page">
        <div className="admin-settings-container">

          <div className="admin-settings-heading">
            <h1>Admin Settings</h1>
            <p>
              Manage your website logo, payment QR code
              and WhatsApp contact details.
            </p>
          </div>

          <form onSubmit={handleSave}>

            {/* WEBSITE LOGO SETTINGS */}

            <section className="admin-setting-card">

              <h2>Website Logo</h2>

              <p className="admin-setting-description">
                Upload the logo displayed in your customer
                and admin panels.
              </p>

              <div className="admin-logo-preview">
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Website Logo"
                  />
                ) : (
                  <p>No logo uploaded</p>
                )}
              </div>

              <label
                htmlFor="logoImage"
                className="admin-qr-upload"
              >
                Choose New Logo
              </label>

              <input
                id="logoImage"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleLogoChange}
              />

              <p className="admin-setting-hint">
                Supported formats: JPG, PNG, WEBP.
                Maximum size: 5 MB.
              </p>

            </section>
            {/* LOGIN PAGE CONTENT SETTINGS */}

            <section className="admin-setting-card">

            <h2>Login Page Content</h2>

            <p className="admin-setting-description">
                Update the heading and description displayed on your
                customer login page.
            </p>

            <label htmlFor="loginHeading">
                Login Page Main Heading
            </label>

            <textarea
                id="loginHeading"
                value={loginHeading}
                onChange={(event) => setLoginHeading(event.target.value)}
                placeholder="Enter login page heading"
                rows={3}
                maxLength={300}
                required
            />

            <label htmlFor="loginDescription">
                Login Page Description
            </label>

            <textarea
                id="loginDescription"
                value={loginDescription}
                onChange={(event) => setLoginDescription(event.target.value)}
                placeholder="Enter login page description"
                rows={4}
                maxLength={1000}
                required
            />

            <p className="admin-setting-hint">
                These details will appear on your customer login page.
            </p>

            </section>

            {/* QR CODE SETTINGS */}

            <section className="admin-setting-card">

              <h2>Payment QR Code</h2>

              <p className="admin-setting-description">
                Upload the QR code that customers will use
                to make payments.
              </p>

              <div className="admin-qr-preview">
                {qrPreview ? (
                  <img
                    src={qrPreview}
                    alt="Payment QR Code"
                  />
                ) : (
                  <p>No QR code uploaded</p>
                )}
              </div>

              <label
                htmlFor="qrImage"
                className="admin-qr-upload"
              >
                Choose New QR Image
              </label>

              <input
                id="qrImage"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleQrChange}
              />

              <p className="admin-setting-hint">
                Supported formats: JPG, PNG, WEBP.
                Maximum size: 5 MB.
              </p>

            </section>

            {/* WHATSAPP SETTINGS */}

            <section className="admin-setting-card">

              <h2>WhatsApp Contact Number</h2>

              <p className="admin-setting-description">
                This number will appear in the Add Funds
                section.
              </p>

              <label htmlFor="whatsappNumber">
                WhatsApp Number (with country code)
              </label>

              <input
                id="whatsappNumber"
                type="tel"
                value={whatsappNumber}
                onChange={(event) =>
                  setWhatsappNumber(event.target.value)
                }
                placeholder="Example: 918376925292"
                maxLength={15}
                required
              />

              <p className="admin-setting-hint">
                Example: 91 followed by your 10-digit
                mobile number.
              </p>

            </section>

            {/* SAVE BUTTON */}

            <button
              type="submit"
              className="admin-settings-save"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Settings"}
            </button>

          </form>

        </div>
      </main>
    </div>
  );
};

export default AdminSettings;
