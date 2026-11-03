import React, { useState } from "react";
import Navbar from "../components/Navbar";
import "../styles/Api.css";


const API_URL = "https://rgbhaimedia.com/api/v2";

const navigation = [
  {
    title: "Getting started",
    items: [
      { id: "overview", label: "Overview" },
      { id: "authentication", label: "Authentication" },
    ],
  },
  {
    title: "Services & orders",
    items: [
      { id: "services", label: "Service list" },
      { id: "add-order", label: "Add order" },
      { id: "order-status", label: "Order status" },
      { id: "multiple-status", label: "Multiple order status" },
    ],
  },
  {
    title: "Order management",
    items: [
      { id: "refill", label: "Create refill" },
      { id: "multiple-refill", label: "Create multiple refills" },
      { id: "refill-status", label: "Refill status" },
      { id: "multiple-refill-status", label: "Multiple refill status" },
      { id: "cancel", label: "Cancel orders" },
    ],
  },
  {
    title: "Account",
    items: [{ id: "balance", label: "User balance" }],
  },
];

const serviceListResponse = `[
  {
    "service": 1,
    "name": "Followers",
    "type": "Default",
    "category": "First Category",
    "rate": "0.90",
    "min": "50",
    "max": "10000",
    "refill": true,
    "cancel": true
  },
  {
    "service": 2,
    "name": "Comments",
    "type": "Custom Comments",
    "category": "Second Category",
    "rate": "8",
    "min": "10",
    "max": "1500",
    "refill": false,
    "cancel": true
  }
]`;

const addOrderResponse = `{
  "order": 23501
}`;

const orderStatusResponse = `{
  "charge": "0.27819",
  "start_count": "3572",
  "status": "Partial",
  "remains": "157",
  "currency": "USD"
}`;

const multipleStatusResponse = `{
  "1": {
    "charge": "0.27819",
    "start_count": "3572",
    "status": "Partial",
    "remains": "157",
    "currency": "USD"
  },
  "10": {
    "error": "Incorrect order ID"
  },
  "100": {
    "charge": "1.44219",
    "start_count": "234",
    "status": "In progress",
    "remains": "10",
    "currency": "USD"
  }
}`;

const refillResponse = `{
  "refill": "1"
}`;

const multipleRefillResponse = `[
  { "order": 1, "refill": 1 },
  { "order": 2, "refill": 2 },
  {
    "order": 3,
    "refill": { "error": "Incorrect order ID" }
  }
]`;

const refillStatusResponse = `{
  "status": "Completed"
}`;

const multipleRefillStatusResponse = `[
  { "refill": 1, "status": "Completed" },
  { "refill": 2, "status": "Rejected" },
  {
    "refill": 3,
    "status": { "error": "Refill not found" }
  }
]`;

const cancelResponse = `[
  {
    "order": 9,
    "cancel": { "error": "Incorrect order ID" }
  },
  { "order": 2, "cancel": 1 }
]`;

const balanceResponse = `{
  "balance": "100.84292",
  "currency": "USD"
}`;

function CopyButton({ value, compact = false }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch (error) {
      console.error("Unable to copy text:", error);
    }
  };

  return (
    <button
      type="button"
      className={`smm-doc-copy ${compact ? "smm-doc-copy--compact" : ""}`}
      onClick={handleCopy}
      aria-label="Copy content"
    >
      <span aria-hidden="true">{copied ? "✓" : "▢"}</span>
      {copied ? "Copied" : compact ? "Copy" : "Copy code"}
    </button>
  );
}

function CodeBlock({ code, language = "json" }) {
  return (
    <div className="smm-doc-code-wrap">
      <div className="smm-doc-code-topline">
        <span>{language}</span>
        <CopyButton value={code} compact />
      </div>
      <pre className="smm-doc-code"><code>{code}</code></pre>
    </div>
  );
}

function ParameterTable({ rows }) {
  return (
    <div className="smm-doc-table-scroll">
      <table className="smm-doc-table">
        <thead>
          <tr>
            <th>Parameter</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([name, description, optional], index) => (
            <tr key={`${name}-${index}`}>
              <td>
                <code>{name}</code>
                {optional ? <span className="smm-doc-optional">Optional</span> : null}
              </td>
              <td>{description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Endpoint({ id, title, description, rows, response, request, note }) {
  return (
    <section className="smm-doc-section" id={id}>
      <div className="smm-doc-section-heading">
        <div>
          <p className="smm-doc-eyebrow">API endpoint</p>
          <h2>{title}</h2>
          {description ? <p className="smm-doc-section-description">{description}</p> : null}
        </div>
        <span className="smm-doc-method">POST</span>
      </div>

      {request ? (
        <div className="smm-doc-request-line">
          <span className="smm-doc-method smm-doc-method--small">POST</span>
          <code>{API_URL}</code>
          <CopyButton value={API_URL} compact />
        </div>
      ) : null}

      <h3>Parameters</h3>
      <ParameterTable rows={rows} />

      {note ? <div className="smm-doc-note">{note}</div> : null}

      {response ? (
        <>
          <h3 className="smm-doc-example-title">Example response</h3>
          <CodeBlock code={response} />
        </>
      ) : null}
    </section>
  );
}

export default function Api() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("overview");

  const handleNavClick = (id) => {
    setActiveSection(id);
    setMobileNavOpen(false);
  };

  const curlExample = `curl --request POST \\\n  --url ${API_URL} \\\n  --header 'Content-Type: application/x-www-form-urlencoded' \\\n  --data-urlencode 'key=YOUR_API_KEY' \\\n  --data-urlencode 'action=services'`;

  return (
    <>
    <Navbar/>
    <div className="smm-api-docs">
      
      {/* <header className="smm-doc-topbar">
        <div className="smm-doc-brand">
          <span className="smm-doc-brand-mark">G</span>
          <span>RG Bhai SMM Panel</span>
          <span className="smm-doc-brand-divider">/</span>
          <span className="smm-doc-brand-subtitle">API Reference</span>
        </div>
        <div className="smm-doc-topbar-right">
          <span className="smm-doc-version">API v2</span>
          <a href="https://rgbhaimedia.com/api" target="_blank" rel="noreferrer">
            Original documentation ↗
          </a>
        </div>
        <button
          className="smm-doc-mobile-toggle"
          type="button"
          onClick={() => setMobileNavOpen((open) => !open)}
          aria-expanded={mobileNavOpen}
          aria-label="Toggle documentation navigation"
        >
          ☰
        </button>
      </header> */}

      <div className="smm-doc-layout">
        <aside className={`smm-doc-sidebar ${mobileNavOpen ? "is-open" : ""}`}>
          <div className="smm-doc-sidebar-label">DOCUMENTATION</div>
          {navigation.map((group) => (
            <div className="smm-doc-nav-group" key={group.title}>
              <div className="smm-doc-nav-group-title">{group.title}</div>
              {group.items.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className={activeSection === item.id ? "active" : ""}
                  onClick={() => handleNavClick(item.id)}
                >
                  <span className="smm-doc-nav-dot" />
                  {item.label}
                </a>
              ))}
            </div>
          ))}
          <div className="smm-doc-sidebar-footer">
            <span className="smm-doc-status-dot" />
            API reference page
          </div>
        </aside>

        <main className="smm-doc-main">
          <section className="smm-doc-hero" id="overview">
            <div className="smm-doc-hero-copy">
              <span className="smm-doc-pill">DEVELOPER DOCUMENTATION</span>
              <h1>API Documentation</h1>
              <p>
                Integrate your application with RGBHAI SMM Panel using the API v2
                endpoints documented on this page.
              </p>
              <div className="smm-doc-hero-meta">
                <span><b>Method</b> POST</span>
                <span><b>Response</b> JSON</span>
                <span><b>Version</b> 2</span>
              </div>
            </div>
            <div className="smm-doc-hero-art" aria-hidden="true">
              <div className="smm-doc-art-orbit smm-doc-art-orbit-one" />
              <div className="smm-doc-art-orbit smm-doc-art-orbit-two" />
              <div className="smm-doc-art-card">
                <span className="smm-doc-art-card-top">API</span>
                <span className="smm-doc-art-braces">{`{ }`}</span>
                <span className="smm-doc-art-card-bottom">JSON RESPONSE</span>
              </div>
            </div>
          </section>

          <section className="smm-doc-overview-grid">
            <div className="smm-doc-info-card">
              <span className="smm-doc-info-icon">↗</span>
              <div>
                <span className="smm-doc-info-label">HTTP method</span>
                <strong>POST</strong>
              </div>
            </div>
            <div className="smm-doc-info-card smm-doc-info-card--wide">
              <span className="smm-doc-info-icon">⌘</span>
              <div className="smm-doc-info-content">
                <span className="smm-doc-info-label">API URL</span>
                <strong className="smm-doc-url">{API_URL}</strong>
              </div>
              <CopyButton value={API_URL} compact />
            </div>
            <div className="smm-doc-info-card">
              <span className="smm-doc-info-icon">{`{ }`}</span>
              <div>
                <span className="smm-doc-info-label">Response format</span>
                <strong>JSON</strong>
              </div>
            </div>
          </section>

          <section className="smm-doc-section" id="authentication">
            <div className="smm-doc-section-heading">
              <div>
                <p className="smm-doc-eyebrow">START HERE</p>
                <h2>Authentication & requests</h2>
                <p className="smm-doc-section-description">
                  Include your API key and the required action in each POST request.
                </p>
              </div>
              <span className="smm-doc-section-number">01</span>
            </div>
            <div className="smm-doc-warning">
              <span className="smm-doc-warning-icon">!</span>
              <div>
                <strong>Keep your API key private</strong>
                <p>
                  Do not place a real provider API key in React code, browser requests,
                  public repositories or screenshots. Make provider requests from your
                  backend and store the key in an environment variable.
                </p>
              </div>
            </div>
            <h3>Common parameters</h3>
            <ParameterTable
              rows={[
                ["key", "Your API key."],
                ["action", "The API operation to perform, such as services, add, status or balance."],
              ]}
            />
            <h3 className="smm-doc-example-title">Example request — service list</h3>
            <CodeBlock code={curlExample} language="bash / cURL" />
          </section>

          <Endpoint
            id="services"
            title="Service list"
            description="Retrieve the services available from the provider."
            request
            rows={[
              ["key", "Your API key."],
              ["action", "Use services."],
            ]}
            response={serviceListResponse}
          />

          <section className="smm-doc-section" id="add-order">
            <div className="smm-doc-section-heading">
              <div>
                <p className="smm-doc-eyebrow">SERVICES & ORDERS</p>
                <h2>Add order</h2>
                <p className="smm-doc-section-description">
                  Submit an order using the parameter set supported by the selected service type.
                </p>
              </div>
              <span className="smm-doc-method">POST</span>
            </div>

            <div className="smm-doc-subendpoint">
              <h3>Standard order</h3>
              <ParameterTable rows={[
                ["key", "Your API key."],
                ["action", "Use add."],
                ["service", "Provider service ID."],
                ["link", "Link to the target page."],
                ["quantity", "Quantity required."],
                ["runs", "Number of runs to deliver.", true],
                ["interval", "Interval between runs, in minutes.", true],
              ]} />
            </div>

            <div className="smm-doc-subendpoint">
              <h3>Custom comments order</h3>
              <ParameterTable rows={[
                ["key", "Your API key."],
                ["action", "Use add."],
                ["service", "Provider service ID."],
                ["link", "Link to the target page."],
                ["comments", "Comments separated by a new line (\\r\\n or \\n)."],
              ]} />
            </div>

            <div className="smm-doc-subendpoint">
              <h3>Subscription order</h3>
              <ParameterTable rows={[
                ["key", "Your API key."],
                ["action", "Use add."],
                ["service", "Provider service ID."],
                ["username", "Target username."],
                ["min", "Minimum quantity."],
                ["max", "Maximum quantity."],
                ["posts", "Limit the number of future posts to parse.", true],
                ["old_posts", "Number of existing posts to parse, if supported.", true],
                ["delay", "Delay in minutes. Supported values are listed in the provider documentation."],
                ["expiry", "Expiry date in d/m/Y format.", true],
              ]} />
            </div>

            <div className="smm-doc-subendpoint">
              <h3>Poll vote order</h3>
              <ParameterTable rows={[
                ["key", "Your API key."],
                ["action", "Use add."],
                ["service", "Provider service ID."],
                ["link", "Link to the poll."],
                ["quantity", "Quantity required."],
                ["answer_number", "Poll answer number."],
              ]} />
            </div>

            <h3 className="smm-doc-example-title">Example response</h3>
            <CodeBlock code={addOrderResponse} />
          </section>

          <Endpoint
            id="order-status"
            title="Order status"
            description="Retrieve the current status and delivery details for one order."
            request
            rows={[
              ["key", "Your API key."],
              ["action", "Use status."],
              ["order", "Provider order ID."],
            ]}
            response={orderStatusResponse}
          />

          <Endpoint
            id="multiple-status"
            title="Multiple order status"
            description="Retrieve statuses for multiple orders in one request. The provider documentation specifies a maximum of 100 IDs."
            request
            rows={[
              ["key", "Your API key."],
              ["action", "Use status."],
              ["orders", "Order IDs separated by commas (up to 100 IDs)."],
            ]}
            response={multipleStatusResponse}
          />

          <Endpoint
            id="refill"
            title="Create refill"
            description="Request a refill for one order."
            request
            rows={[
              ["key", "Your API key."],
              ["action", "Use refill."],
              ["order", "Provider order ID."],
            ]}
            response={refillResponse}
          />

          <Endpoint
            id="multiple-refill"
            title="Create multiple refills"
            description="Request refills for multiple orders, up to 100 IDs."
            request
            rows={[
              ["key", "Your API key."],
              ["action", "Use refill."],
              ["orders", "Order IDs separated by commas (up to 100 IDs)."],
            ]}
            response={multipleRefillResponse}
          />

          <Endpoint
            id="refill-status"
            title="Get refill status"
            description="Retrieve the status of one refill request."
            request
            rows={[
              ["key", "Your API key."],
              ["action", "Use refill_status."],
              ["refill", "Provider refill ID."],
            ]}
            response={refillStatusResponse}
          />

          <Endpoint
            id="multiple-refill-status"
            title="Get multiple refill statuses"
            description="Retrieve the status of multiple refill requests, up to 100 IDs."
            request
            rows={[
              ["key", "Your API key."],
              ["action", "Use refill_status."],
              ["refills", "Refill IDs separated by commas (up to 100 IDs)."],
            ]}
            response={multipleRefillStatusResponse}
          />

          <Endpoint
            id="cancel"
            title="Cancel orders"
            description="Submit cancellation requests for multiple orders, up to 100 IDs."
            request
            rows={[
              ["key", "Your API key."],
              ["action", "Use cancel."],
              ["orders", "Order IDs separated by commas (up to 100 IDs)."],
            ]}
            response={cancelResponse}
          />

          <Endpoint
            id="balance"
            title="User balance"
            description="Retrieve the provider account balance and currency."
            request
            rows={[
              ["key", "Your API key."],
              ["action", "Use balance."],
            ]}
            response={balanceResponse}
          />

          <footer className="smm-doc-footer">
            <div>
              <strong>RGBHAI SMM Panel API v2</strong>
              <p>
                This is an independently built documentation interface based on the
                provider's published API reference. Check the provider's live
                documentation for any updates before integrating.
              </p>
            </div>
            <a href="https://rgbhaimedia.com/api-integeration" target="_blank" rel="noreferrer">
              View provider documentation ↗
            </a>
          </footer>
        </main>
      </div>
    </div>
    </>
  );
}
