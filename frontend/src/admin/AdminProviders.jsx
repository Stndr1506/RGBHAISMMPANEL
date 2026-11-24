
import React, { useEffect, useState } from "react";
import axios from "axios";
import AdminNavbar from "../components/AdminNavbar";
import "../styles/AdminProviders.css";

const API_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000";

const AdminProviders = () => {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [fetchingServices, setFetchingServices] = useState(false);
  const [disconnectingProviderId, setDisconnectingProviderId] =
    useState(null);

  const [providerName, setProviderName] = useState("");
  const [apiUrl, setApiUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [currency, setCurrency] = useState("INR");

  const [balance, setBalance] = useState(null);
  const [services, setServices] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const token = localStorage.getItem("token");

  const authConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const fetchProviders = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get(
        `${API_URL}/api/admin/providers`,
        authConfig
      );

      setProviders(response.data.providers || []);
    } catch (err) {
      console.error("Fetch providers error:", err.response?.data || err);

      setError(
        err.response?.data?.message || "Unable to load providers."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const validateProviderForm = () => {
    if (!providerName.trim()) {
      setError("Please enter provider name.");
      return false;
    }

    if (!apiUrl.trim()) {
      setError("Please enter API endpoint.");
      return false;
    }

    if (!apiKey.trim()) {
      setError("Please enter API key.");
      return false;
    }

    try {
      const parsedUrl = new URL(apiUrl.trim());

      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        setError("Please enter a valid HTTP or HTTPS API URL.");
        return false;
      }
    } catch {
      setError("Please enter a valid API URL.");
      return false;
    }

    return true;
  };

  const handleTestConnection = async () => {
    if (!validateProviderForm()) return;

    try {
      setTesting(true);
      setError("");
      setSuccess("");
      setBalance(null);

      const response = await axios.post(
        `${API_URL}/api/admin/providers/test`,
        {
          apiUrl: apiUrl.trim(),
          apiKey: apiKey.trim(),
        },
        authConfig
      );

      setBalance(response.data.balance);
      setSuccess("Provider connection successful!");
    } catch (err) {
      console.error("Provider test error:", err.response?.data || err);

      setError(
        err.response?.data?.message || "Connection failed."
      );
    } finally {
      setTesting(false);
    }
  };

  const handleSaveProvider = async () => {
    if (!validateProviderForm()) return;

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await axios.post(
        `${API_URL}/api/admin/providers`,
        {
          providerName: providerName.trim(),
          apiUrl: apiUrl.trim(),
          apiKey: apiKey.trim(),
          currency,
        },
        authConfig
      );

      setSuccess(
        response.data.message || "Provider saved successfully."
      );

      setProviderName("");
      setApiUrl("");
      setApiKey("");
      setCurrency("INR");
      setBalance(null);
      setServices([]);

      await fetchProviders();
    } catch (err) {
      console.error("Save provider error:", err.response?.data || err);

      setError(
        err.response?.data?.message || "Unable to save provider."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleFetchServices = async (providerId, providerName) => {
    try {
      setFetchingServices(true);
      setError("");
      setSuccess("");
      setServices([]);

      const response = await axios.get(
        `${API_URL}/api/admin/providers/${providerId}/services`,
        authConfig
      );

      setServices(response.data.services || []);

      setSuccess(
        `${response.data.total || 0} services fetched from ${providerName}.`
      );
    } catch (err) {
      console.error(
        "Fetch provider services error:",
        err.response?.data || err
      );

      setError(
        err.response?.data?.message || "Unable to fetch services."
      );
    } finally {
      setFetchingServices(false);
    }
  };

  const handleDisconnectProvider = async (provider) => {
    const confirmed = window.confirm(
      `Are you sure you want to disconnect ${provider.provider_name}?`
    );

    if (!confirmed) return;

    try {
      setDisconnectingProviderId(provider.id);
      setError("");
      setSuccess("");
      setServices([]);

      const response = await axios.patch(
        `${API_URL}/api/admin/providers/${provider.id}/disconnect`,
        {},
        authConfig
      );

      setSuccess(
        response.data.message || "Provider disconnected successfully."
      );

      await fetchProviders();
    } catch (err) {
      console.error(
        "Disconnect provider error:",
        err.response?.data || err
      );

      setError(
        err.response?.data?.message || "Unable to disconnect provider."
      );
    } finally {
      setDisconnectingProviderId(null);
    }
  };

  return (
    <>
      <AdminNavbar />

      <div className="providers-page">
        <div className="providers-header">
          <div>
            <h1>Provider Management</h1>
            <p>
              Connect and manage external service providers.
            </p>
          </div>
        </div>

        {error && (
          <div className="provider-alert provider-error">
            {error}
          </div>
        )}

        {success && (
          <div className="provider-alert provider-success">
            {success}
          </div>
        )}

        <div className="provider-card">
          <div className="provider-card-header">
            <div>
              <h2>Connect Provider</h2>
              <p>Enter your external provider API details.</p>
            </div>

            <span className="provider-brand">API</span>
          </div>

          <div className="provider-form">
            <div className="provider-form-group">
              <label>Provider Name</label>

              <input
                type="text"
                value={providerName}
                onChange={(e) => setProviderName(e.target.value)}
                placeholder="Enter provider name"
              />
            </div>

            <div className="provider-form-group">
              <label>API Endpoint</label>

              <input
                type="text"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="https://example.com/api/v2"
              />
            </div>

            <div className="provider-form-group">
              <label>API Key</label>

              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter API key"
                autoComplete="new-password"
              />
            </div>

            <div className="provider-form-group">
              <label>Currency</label>

              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                <option value="INR">INR</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
            </div>

            <div className="provider-actions">
              <button
                type="button"
                className="provider-test-btn"
                onClick={handleTestConnection}
                disabled={testing || saving}
              >
                {testing ? "Testing..." : "Test Connection"}
              </button>

              <button
                type="button"
                className="provider-save-btn"
                onClick={handleSaveProvider}
                disabled={saving || testing}
              >
                {saving ? "Saving..." : "Save Provider"}
              </button>
            </div>
          </div>

          {balance && (
            <div className="provider-balance">
              <span>Provider Wallet Balance</span>

              <strong>
                {balance.balance ?? "-"} {balance.currency ?? ""}
              </strong>
            </div>
          )}
        </div>

        <div className="provider-card">
          <div className="provider-section-header">
            <div>
              <h2>Connected Providers</h2>
              <p>Manage your saved provider connections.</p>
            </div>

            <button
              type="button"
              className="provider-refresh-btn"
              onClick={fetchProviders}
              disabled={loading}
            >
              ↻ Refresh
            </button>
          </div>

          {loading ? (
            <div className="provider-empty">
              Loading providers...
            </div>
          ) : providers.length === 0 ? (
            <div className="provider-empty">
              No providers connected yet.
            </div>
          ) : (
            <div className="provider-table-wrapper">
              <table className="provider-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Provider</th>
                    <th>API Endpoint</th>
                    <th>Currency</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {providers.map((provider) => {
                    const isActive =
                      String(provider.status).toLowerCase() === "active";

                    const isDisconnecting =
                      disconnectingProviderId === provider.id;

                    return (
                      <tr key={provider.id}>
                        <td>{provider.id}</td>

                        <td>
                          <strong>{provider.provider_name}</strong>
                        </td>

                        <td>{provider.api_url}</td>

                        <td>{provider.currency}</td>

                        <td>
                          <span
                            className={
                              isActive
                                ? "provider-status active"
                                : "provider-status inactive"
                            }
                          >
                            {provider.status}
                          </span>
                        </td>

                        <td>
                          <div className="provider-row-actions">
                            <button
                              type="button"
                              className="provider-fetch-btn"
                              onClick={() =>
                                handleFetchServices(
                                  provider.id,
                                  provider.provider_name
                                )
                              }
                              disabled={
                                !isActive ||
                                fetchingServices ||
                                disconnectingProviderId !== null
                              }
                            >
                              {fetchingServices
                                ? "Fetching..."
                                : "Fetch Services"}
                            </button>

                            {isActive ? (
                              <button
                                type="button"
                                className="provider-disconnect-btn"
                                onClick={() =>
                                  handleDisconnectProvider(provider)
                                }
                                disabled={
                                  disconnectingProviderId !== null ||
                                  fetchingServices
                                }
                              >
                                {isDisconnecting
                                  ? "Disconnecting..."
                                  : "Disconnect"}
                              </button>
                            ) : (
                              <span className="provider-disconnected-label">
                                Disconnected
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {services.length > 0 && (
          <div className="provider-card">
            <div className="provider-section-header">
              <div>
                <h2>Provider Services</h2>
                <p>
                  {services.length} services received from the provider.
                </p>
              </div>
            </div>

            <div className="provider-table-wrapper">
              <table className="provider-table">
                <thead>
                  <tr>
                    <th>Service ID</th>
                    <th>Service Name</th>
                    <th>Category</th>
                    <th>Type</th>
                    <th>Rate</th>
                    <th>Min</th>
                    <th>Max</th>
                  </tr>
                </thead>

                <tbody>
                  {services.map((service, index) => (
                    <tr key={`${service.service}-${index}`}>
                      <td>{service.service ?? "-"}</td>
                      <td>{service.name ?? "-"}</td>
                      <td>{service.category ?? "-"}</td>
                      <td>{service.type ?? "-"}</td>
                      <td>{service.rate ?? "-"}</td>
                      <td>{service.min ?? "-"}</td>
                      <td>{service.max ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default AdminProviders;
