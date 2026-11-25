
import React, { useEffect, useMemo, useState } from "react";
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
  const [importingServices, setImportingServices] = useState(false);

  const [disconnectingProviderId, setDisconnectingProviderId] =
    useState(null);

  const [providerName, setProviderName] = useState("");
  const [apiUrl, setApiUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [currency, setCurrency] = useState("INR");

  const [balance, setBalance] = useState(null);
  const [services, setServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);

  const [currentProvider, setCurrentProvider] = useState(null);

  const [markupType, setMarkupType] = useState("percent");
  const [markupValue, setMarkupValue] = useState("20");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const token = localStorage.getItem("token");

  const authConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  // ---------------------------------------
  // FETCH CONNECTED PROVIDERS
  // ---------------------------------------

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

  // ---------------------------------------
  // PROVIDER FORM VALIDATION
  // ---------------------------------------

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

  // ---------------------------------------
  // TEST PROVIDER CONNECTION
  // ---------------------------------------

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

  // ---------------------------------------
  // SAVE PROVIDER
  // ---------------------------------------

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
      setSelectedServices([]);
      setCurrentProvider(null);

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

  // ---------------------------------------
  // FETCH PROVIDER SERVICES
  // ---------------------------------------

  const handleFetchServices = async (providerId, name) => {
    try {
      setFetchingServices(true);
      setError("");
      setSuccess("");

      setServices([]);
      setSelectedServices([]);
      setCurrentProvider({
        id: providerId,
        name,
      });

      const response = await axios.get(
        `${API_URL}/api/admin/providers/${providerId}/services`,
        authConfig
      );

      const fetchedServices = response.data.services || [];

      setServices(fetchedServices);

      setSuccess(
        `${response.data.total || fetchedServices.length} services fetched from ${name}.`
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

  // ---------------------------------------
  // DISCONNECT PROVIDER
  // ---------------------------------------

  const handleDisconnectProvider = async (provider) => {
    const confirmed = window.confirm(
      `Are you sure you want to disconnect ${provider.provider_name}?`
    );

    if (!confirmed) return;

    try {
      setDisconnectingProviderId(provider.id);
      setError("");
      setSuccess("");

      if (currentProvider?.id === provider.id) {
        setServices([]);
        setSelectedServices([]);
        setCurrentProvider(null);
      }

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

  // ---------------------------------------
  // MARKUP CALCULATION
  // ---------------------------------------

  const getCustomerRate = (providerRate) => {
    const rate = Number(providerRate);
    const markup = Number(markupValue);

    if (
      !Number.isFinite(rate) ||
      !Number.isFinite(markup) ||
      rate < 0 ||
      markup < 0
    ) {
      return null;
    }

    if (markupType === "percent") {
      return rate + (rate * markup) / 100;
    }

    return rate + markup;
  };

  const selectedCount = selectedServices.length;

  const allServicesSelected =
    services.length > 0 &&
    selectedServices.length === services.length;

  const validMarkup =
    Number.isFinite(Number(markupValue)) &&
    Number(markupValue) >= 0 &&
    markupValue !== "";

  // ---------------------------------------
  // SELECT / DESELECT SERVICE
  // ---------------------------------------

  const handleSelectService = (serviceId) => {
    const id = String(serviceId);

    setSelectedServices((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id]
    );
  };

  const handleSelectAll = () => {
    if (allServicesSelected) {
      setSelectedServices([]);
      return;
    }

    setSelectedServices(
      services.map((service) => String(service.service))
    );
  };

  // ---------------------------------------
  // PREPARE SELECTED SERVICES FOR IMPORT
  // ---------------------------------------

  const servicesToImport = useMemo(() => {
    return services
      .filter((service) =>
        selectedServices.includes(String(service.service))
      )
      .map((service) => ({
        serviceId: String(service.service ?? ""),
        name: String(service.name ?? ""),
        category: String(service.category ?? ""),
        type: String(service.type ?? ""),
        rate: Number(service.rate),
        min: Number(service.min),
        max: Number(service.max),
        description: String(service.description ?? ""),
        averageTime: String(
          service.average_time ?? service.averageTime ?? "Not specified"
        ),

        refill: ["1", "true", "yes"].includes(
          String(service.refill ?? service.refill_enabled ?? false).toLowerCase()
        ),

        cancel: ["1", "true", "yes"].includes(
          String(service.cancel ?? service.cancel_enabled ?? false).toLowerCase()
        ),
      }));
  }, [services, selectedServices]);

  // ---------------------------------------
  // IMPORT SELECTED SERVICES
  // ---------------------------------------

  const handleImportServices = async () => {
    if (!currentProvider?.id) {
      setError("Please fetch services from a provider first.");
      return;
    }

    if (selectedServices.length === 0) {
      setError("Please select at least one service.");
      return;
    }

    if (!validMarkup) {
      setError("Please enter a valid non-negative markup value.");
      return;
    }

    const invalidServices = servicesToImport.filter(
      (service) =>
        !service.serviceId ||
        service.serviceId.length > 200 ||
        !Number.isFinite(service.rate) ||
        service.rate < 0 ||
        !Number.isInteger(service.min) ||
        !Number.isInteger(service.max) ||
        service.min < 0 ||
        service.max < service.min
    );

    if (invalidServices.length > 0) {
      setError(
        `${invalidServices.length} selected service(s) have invalid provider data. Please review the provider response.`
      );
      return;
    }

    try {
      setImportingServices(true);
      setError("");
      setSuccess("");

      const response = await axios.post(
        `${API_URL}/api/admin/providers/${currentProvider.id}/import`,
        {
          services: servicesToImport,
          markupType,
          markupValue: Number(markupValue),
        },
        authConfig
      );

      const result = response.data;

      const imported = result.importedCount ?? result.imported?.length ?? 0;
      const skipped = result.skippedCount ?? result.skipped?.length ?? 0;

      setSuccess(
        `Import completed! Imported: ${imported}, Skipped: ${skipped}.`
      );

      setSelectedServices([]);

    } catch (err) {
      console.error(
        "Import provider services error:",
        err.response?.data || err
      );

      setError(
        err.response?.data?.message || "Unable to import provider services."
      );
    } finally {
      setImportingServices(false);
    }
  };

  // ---------------------------------------
  // UI
  // ---------------------------------------

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

        {/* CONNECT PROVIDER */}

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

        {/* CONNECTED PROVIDERS */}

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
                                importingServices ||
                                disconnectingProviderId !== null
                              }
                            >
                              {fetchingServices &&
                              currentProvider?.id === provider.id
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
                                  fetchingServices ||
                                  importingServices
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

        {/* PROVIDER SERVICES */}

        {services.length > 0 && (

          <div className="provider-card">

            <div className="provider-section-header">
              <div>
                <h2>Provider Services</h2>
                <p>
                  {services.length} services received from{" "}
                  {currentProvider?.name}.
                </p>
              </div>
            </div>

            {/* MARKUP SETTINGS */}

            <div className="provider-import-settings">

              <div className="provider-markup-field">
                <label>Markup Type</label>

                <select
                  value={markupType}
                  onChange={(e) => setMarkupType(e.target.value)}
                  disabled={importingServices}
                >
                  <option value="percent">
                    Percentage (%)
                  </option>

                  <option value="fixed">
                    Fixed Amount per 1,000
                  </option>
                </select>
              </div>

              <div className="provider-markup-field">
                <label>
                  {markupType === "percent"
                    ? "Markup Percentage (%)"
                    : "Fixed Markup Amount per 1,000"}
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={markupValue}
                  onChange={(e) => setMarkupValue(e.target.value)}
                  placeholder="Enter markup"
                  disabled={importingServices}
                />
              </div>

              <div className="provider-markup-info">
                <strong>Customer Rate Calculation</strong>

                <p>
                  {markupType === "percent"
                    ? "Customer Rate = Provider Rate + Percentage Markup"
                    : "Customer Rate = Provider Rate + Fixed Markup"}
                </p>
              </div>

            </div>

            {/* SELECTION SUMMARY */}

            <div className="provider-selection-bar">

              <label className="provider-select-all">
                <input
                  type="checkbox"
                  checked={allServicesSelected}
                  onChange={handleSelectAll}
                  disabled={importingServices}
                />

                <span>Select All Services</span>
              </label>

              <span>
                Selected: <strong>{selectedCount}</strong> / {services.length}
              </span>

              <button
                type="button"
                className="provider-import-btn"
                onClick={handleImportServices}
                disabled={
                  importingServices ||
                  selectedCount === 0 ||
                  !validMarkup
                }
              >
                {importingServices
                  ? "Importing..."
                  : `Import Selected (${selectedCount})`}
              </button>

            </div>

            {/* SERVICES TABLE */}

            <div className="provider-table-wrapper">

              <table className="provider-table">

                <thead>
                  <tr>
                    <th>Select</th>
                    <th>Service ID</th>
                    <th>Service Name</th>
                    <th>Category</th>
                    <th>Type</th>
                    <th>Provider Rate</th>
                    <th>Markup</th>
                    <th>Customer Rate</th>
                    <th>Min</th>
                    <th>Max</th>
                  </tr>
                </thead>

                <tbody>

                  {services.map((service, index) => {

                    const serviceId = String(service.service);
                    const isSelected =
                      selectedServices.includes(serviceId);

                    const customerRate = getCustomerRate(service.rate);

                    return (
                      <tr key={`${serviceId}-${index}`}>

                        <td>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() =>
                              handleSelectService(serviceId)
                            }
                            disabled={importingServices}
                          />
                        </td>

                        <td>{service.service ?? "-"}</td>

                        <td>{service.name ?? "-"}</td>

                        <td>{service.category ?? "-"}</td>

                        <td>{service.type ?? "-"}</td>

                        <td>
                          {Number.isFinite(Number(service.rate))
                            ? Number(service.rate).toFixed(2)
                            : "-"}
                        </td>

                        <td>
                          {markupType === "percent"
                            ? `${markupValue || 0}%`
                            : Number(markupValue || 0).toFixed(2)}
                        </td>

                        <td>
                          <strong>
                            {customerRate !== null
                              ? customerRate.toFixed(2)
                              : "-"}
                          </strong>
                        </td>

                        <td>{service.min ?? "-"}</td>

                        <td>{service.max ?? "-"}</td>

                      </tr>
                    );
                  })}

                </tbody>

              </table>

            </div>

            <div className="provider-import-note">
              <strong>Note:</strong> Imported services will be created as
              Active local services. Services already mapped to this
              provider will be skipped.
            </div>

          </div>

        )}

      </div>
    </>
  );
};

export default AdminProviders;
