import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import "../styles/ApiManagement.css";

// Set REACT_APP_API_URL in your frontend environment for production.
// Example: REACT_APP_API_URL=https://rgbhaismmpanel-updtbackend.onrender.com
const API_BASE_URL = (
  process.env.REACT_APP_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

const API_KEYS_URL = `${API_BASE_URL}/api/api-keys`;

async function readResponse(response) {
  const rawText = await response.text();
  let data = {};

  if (rawText) {
    try {
      data = JSON.parse(rawText);
    } catch {
      data = { message: rawText };
    }
  }

  if (!response.ok) {
    throw new Error(
      data.message || data.error || `Request failed (${response.status})`
    );
  }

  return data;
}

function getErrorMessage(error) {
  return error?.message || "Something went wrong. Please try again.";
}

function getApiKeyArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.apiKeys)) return payload.apiKeys;
  if (Array.isArray(payload?.api_keys)) return payload.api_keys;
  if (Array.isArray(payload?.keys)) return payload.keys;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.apiKeys)) return payload.data.apiKeys;
  if (Array.isArray(payload?.data?.keys)) return payload.data.keys;
  return [];
}

function findGeneratedSecret(payload) {
  const candidates = [payload, payload?.data, payload?.apiKey, payload?.api_key];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.startsWith("rgb_live_")) {
      return candidate;
    }

    if (candidate && typeof candidate === "object") {
      const possibleValues = [
        candidate.apiKey,
        candidate.api_key,
        candidate.key,
        candidate.secret,
        candidate.plainTextKey,
        candidate.plaintext_key,
      ];

      const found = possibleValues.find(
        (value) => typeof value === "string" && value.startsWith("rgb_live_")
      );
      if (found) return found;
    }
  }

  return null;
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
}

function isKeyActive(apiKey) {
  if (typeof apiKey?.is_active === "boolean") return apiKey.is_active;
  if (typeof apiKey?.isActive === "boolean") return apiKey.isActive;
  if (typeof apiKey?.active === "boolean") return apiKey.active;
  const status = String(apiKey?.status || "").toLowerCase();
  if (status) return status === "active";
  return true;
}

export default function ApiManagement() {
  const [apiKeys, setApiKeys] = useState([]);
  const [keyName, setKeyName] = useState("My API Key");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [revokingId, setRevokingId] = useState(null);
  const [generatedKey, setGeneratedKey] = useState("");
  const [notice, setNotice] = useState({ type: "", message: "" });
  const [copied, setCopied] = useState(false);

  const token = useMemo(() => localStorage.getItem("token"), []);

  const apiRequest = useCallback(
    async (url, options = {}) => {
      if (!token) {
        throw new Error("Your login session is missing. Please log in again.");
      }

      const response = await fetch(url, {
        ...options,
        headers: {
          ...(options.body ? { "Content-Type": "application/json" } : {}),
          Authorization: `Bearer ${token}`,
          ...options.headers,
        },
      });

      return readResponse(response);
    },
    [token]
  );

  const loadApiKeys = useCallback(async () => {
    setLoading(true);

    try {
      const payload = await apiRequest(API_KEYS_URL);
      setApiKeys(getApiKeyArray(payload));
    } catch (error) {
      setNotice({ type: "error", message: getErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  }, [apiRequest]);

  useEffect(() => {
    loadApiKeys();
  }, [loadApiKeys]);

  const handleGenerateKey = async (event) => {
    event.preventDefault();
    setGenerating(true);
    setGeneratedKey("");
    setNotice({ type: "", message: "" });

    try {
      const payload = await apiRequest(API_KEYS_URL, {
        method: "POST",
        body: JSON.stringify({ name: keyName.trim() || "My API Key" }),
      });

      const secret = findGeneratedSecret(payload);
      if (secret) {
        setGeneratedKey(secret);
        setCopied(false);
        setNotice({
          type: "success",
          message: "API key generated. Copy and save it now; the full key may not be shown again.",
        });
      } else {
        setNotice({
          type: "warning",
          message:
            payload?.message ||
            "The API key was created, but the response did not contain a recognizable one-time key. Check the API key controller response format.",
        });
      }

      await loadApiKeys();
    } catch (error) {
      setNotice({ type: "error", message: getErrorMessage(error) });
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyGeneratedKey = async () => {
    if (!generatedKey) return;

    try {
      await navigator.clipboard.writeText(generatedKey);
      setCopied(true);
      setNotice({ type: "success", message: "API key copied to clipboard." });
    } catch {
      setNotice({
        type: "error",
        message: "Clipboard access was blocked. Select and copy the API key manually.",
      });
    }
  };

  const handleRevokeKey = async (apiKey) => {
    const id = apiKey?.id ?? apiKey?.api_key_id ?? apiKey?.apiKeyId;
    if (id === undefined || id === null) {
      setNotice({
        type: "error",
        message: "This API key record does not include an ID, so it cannot be revoked from this page.",
      });
      return;
    }

    const confirmed = window.confirm(
      `Revoke API key${apiKey?.name ? ` “${apiKey.name}”` : ""}? Any application using this key will stop authenticating.`
    );
    if (!confirmed) return;

    setRevokingId(id);
    setNotice({ type: "", message: "" });

    try {
      const payload = await apiRequest(`${API_KEYS_URL}/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      setNotice({
        type: "success",
        message: payload?.message || "API key revoked successfully.",
      });
      await loadApiKeys();
    } catch (error) {
      setNotice({ type: "error", message: getErrorMessage(error) });
    } finally {
      setRevokingId(null);
    }
  };

  return (
    <>
      <Navbar />
      <main className="rgb-api-management">
        <section className="rgb-api-hero">
          <div>
            <span className="rgb-api-eyebrow">DEVELOPER TOOLS</span>
            <h1>API Management</h1>
            <p>
              Create and manage API keys for connecting your reseller application
              to RGBHAI SMM Panel.
            </p>
          </div>
          <div className="rgb-api-hero-icon" aria-hidden="true">
            <span>API</span>
            <strong>⌘</strong>
          </div>
        </section>

        {notice.message ? (
          <div className={`rgb-api-alert rgb-api-alert--${notice.type || "info"}`} role="status">
            {notice.message}
          </div>
        ) : null}

        <div className="rgb-api-management-grid">
          <section className="rgb-api-panel rgb-api-create-panel">
            <div className="rgb-api-panel-heading">
              <div>
                <span className="rgb-api-eyebrow">NEW CREDENTIAL</span>
                <h2>Generate API key</h2>
              </div>
              <span className="rgb-api-panel-icon">＋</span>
            </div>

            <form onSubmit={handleGenerateKey}>
              <label htmlFor="api-key-name">API key name</label>
              <input
                id="api-key-name"
                type="text"
                value={keyName}
                onChange={(event) => setKeyName(event.target.value)}
                maxLength={80}
                placeholder="e.g. Main reseller website"
              />
              <p className="rgb-api-field-help">
                Use a name that helps you identify where this key is being used.
              </p>
              <button className="rgb-api-primary-btn" type="submit" disabled={generating}>
                {generating ? "Generating..." : "Generate new API key"}
              </button>
            </form>

            {generatedKey ? (
              <div className="rgb-api-secret-box">
                <div>
                  <strong>Your new API key</strong>
                  <span>Copy it now. For security, the full key is only shown after creation.</span>
                </div>
                <code>{generatedKey}</code>
                <button type="button" className="rgb-api-secondary-btn" onClick={handleCopyGeneratedKey}>
                  {copied ? "Copied" : "Copy API key"}
                </button>
              </div>
            ) : null}
          </section>

          <section className="rgb-api-panel rgb-api-security-panel">
            <div className="rgb-api-panel-heading">
              <div>
                <span className="rgb-api-eyebrow">KEEP YOUR ACCOUNT SAFE</span>
                <h2>API key security</h2>
              </div>
              <span className="rgb-api-panel-icon">✓</span>
            </div>
            <ul className="rgb-api-security-list">
              <li>Never share your API key with anyone.</li>
              <li>Do not put private API keys in frontend React code or public repositories.</li>
              <li>Store keys securely on your backend in environment variables.</li>
              <li>Revoke any key that you no longer use or believe has been exposed.</li>
            </ul>
          </section>
        </div>

        <section className="rgb-api-panel rgb-api-keys-panel">
          <div className="rgb-api-panel-heading rgb-api-keys-heading">
            <div>
              <span className="rgb-api-eyebrow">YOUR CREDENTIALS</span>
              <h2>API keys</h2>
              <p>Full API keys are not displayed in this list.</p>
            </div>
            <button
              type="button"
              className="rgb-api-secondary-btn"
              onClick={loadApiKeys}
              disabled={loading}
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          {loading ? (
            <div className="rgb-api-empty-state">Loading your API keys...</div>
          ) : apiKeys.length === 0 ? (
            <div className="rgb-api-empty-state">
              <strong>No API keys found</strong>
              <span>Generate your first API key to connect an application.</span>
            </div>
          ) : (
            <div className="rgb-api-table-scroll">
              <table className="rgb-api-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Key prefix</th>
                    <th>Created</th>
                    <th>Last used</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {apiKeys.map((apiKey, index) => {
                    const id = apiKey?.id ?? apiKey?.api_key_id ?? apiKey?.apiKeyId ?? index;
                    const active = isKeyActive(apiKey);
                    const prefix =
                      apiKey?.key_prefix ||
                      apiKey?.keyPrefix ||
                      apiKey?.prefix ||
                      "rgb_live_••••••••";

                    return (
                      <tr key={id}>
                        <td data-label="Name">{apiKey?.name || "Unnamed API key"}</td>
                        <td data-label="Key prefix"><code>{prefix}</code></td>
                        <td data-label="Created">{formatDate(apiKey?.created_at || apiKey?.createdAt)}</td>
                        <td data-label="Last used">{formatDate(apiKey?.last_used_at || apiKey?.lastUsedAt)}</td>
                        <td data-label="Status">
                          <span className={`rgb-api-status ${active ? "is-active" : "is-revoked"}`}>
                            {active ? "Active" : "Revoked"}
                          </span>
                        </td>
                        <td data-label="Action">
                          <button
                            type="button"
                            className="rgb-api-revoke-btn"
                            onClick={() => handleRevokeKey(apiKey)}
                            disabled={!active || revokingId === (apiKey?.id ?? apiKey?.api_key_id ?? apiKey?.apiKeyId)}
                          >
                            {revokingId === (apiKey?.id ?? apiKey?.api_key_id ?? apiKey?.apiKeyId)
                              ? "Revoking..."
                              : "Revoke"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <p className="rgb-api-doc-link">
          Need integration instructions? Open the {" "}
          <Link to="/api-integration">
            API documentation
          </Link>
        </p>
      </main>
    </>
  );
}
