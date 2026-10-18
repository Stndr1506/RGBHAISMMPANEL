
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "../styles/NewOrder.css";
import WhatsAppButton from "../components/WhatsappButton";
import Navbar from "../components/Navbar";

const API_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000";

function NewOrder() {
  const [services, setServices] = useState([]);
  const [category, setCategory] = useState("All Categories");
  const [serviceId, setServiceId] = useState("");
  const [link, setLink] = useState("");
  const [quantity, setQuantity] = useState("");
  const [walletBalance, setWalletBalance] = useState(0);

  const [servicesLoading, setServicesLoading] = useState(true);
  const [walletLoading, setWalletLoading] = useState(true);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderConfirmation, setOrderConfirmation] = useState(null);

  // ==========================================
  // FETCH SERVICES
  // ==========================================
  const fetchServices = async () => {
    try {
      setServicesLoading(true);

      const response = await axios.get(
        `${API_URL}/api/dashboard-service`
      );

      setServices(response.data.services || []);
    } catch (error) {
      console.error("Error fetching services:", error);
      alert("Unable to load services.");
    } finally {
      setServicesLoading(false);
    }
  };

  // ==========================================
  // FETCH WALLET BALANCE
  // Returns the refreshed balance when successful.
  // ==========================================
  const fetchWalletBalance = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      localStorage.removeItem("user");
      window.location.replace("/");
      return null;
    }

    try {
      setWalletLoading(true);

      const response = await axios.get(
        `${API_URL}/api/wallet/balance`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const balance = Number(response.data.balance);

      if (!Number.isFinite(balance)) {
        throw new Error("Wallet API returned an invalid balance.");
      }

      setWalletBalance(balance);
      return balance;
    } catch (error) {
      const status = error.response?.status;
      const message = error.response?.data?.message || error.message;

      console.error("Wallet request failed:", status, message);

      if (status === 401 || status === 403) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.replace("/");
        return null;
      }

      return null;
    } finally {
      setWalletLoading(false);
    }
  };

  // ==========================================
  // LOAD PAGE DATA
  // ==========================================
  useEffect(() => {
    fetchServices();
    fetchWalletBalance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ==========================================
  // CATEGORIES
  // ==========================================
  const categories = useMemo(() => {
    const uniqueCategories = [
      ...new Set(services.map((service) => service.category)),
    ];

    return ["All Categories", ...uniqueCategories];
  }, [services]);

  // ==========================================
  // FILTER SERVICES
  // ==========================================
  const filteredServices = useMemo(() => {
    if (category === "All Categories") {
      return services;
    }

    return services.filter(
      (service) => service.category === category
    );
  }, [category, services]);

  // ==========================================
  // SELECTED SERVICE
  // ==========================================
  const selectedService = services.find(
    (service) => String(service.id) === String(serviceId)
  );

  const minOrder = selectedService
    ? Number(selectedService.min_order ?? selectedService.min)
    : 0;

  const maxOrder = selectedService
    ? Number(selectedService.max_order ?? selectedService.max)
    : 0;

  // ==========================================
  // TOTAL PRICE: RATE PER 1000
  // ==========================================
  const totalPrice = selectedService
    ? (Number(quantity) || 0) *
      (Number(selectedService.rate) / 1000)
    : 0;

  const insufficientBalance = totalPrice > walletBalance;

  // ==========================================
  // CATEGORY CHANGE
  // ==========================================
  const handleCategoryChange = (value) => {
    setCategory(value);

    const categoryServices =
      value === "All Categories"
        ? services
        : services.filter((service) => service.category === value);

    if (categoryServices.length > 0) {
      const firstService = categoryServices[0];

      setServiceId(String(firstService.id));
      setQuantity(
        String(firstService.min_order ?? firstService.min ?? "")
      );
    } else {
      setServiceId("");
      setQuantity("");
    }
  };

  // ==========================================
  // SERVICE CHANGE
  // ==========================================
  const handleServiceChange = (value) => {
    setServiceId(value);

    const service = services.find(
      (item) => String(item.id) === String(value)
    );

    setQuantity(
      service
        ? String(service.min_order ?? service.min ?? "")
        : ""
    );
  };

  // ==========================================
  // PLACE ORDER
  // ==========================================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (orderLoading) return;

    setOrderConfirmation(null);

    if (!selectedService) {
      alert("Please select a service.");
      return;
    }

    if (!link.trim()) {
      alert("Please enter a link.");
      return;
    }

    const orderQuantity = Number(quantity);

    if (!Number.isInteger(orderQuantity) || orderQuantity <= 0) {
      alert("Please enter a valid whole-number quantity.");
      return;
    }

    if (
      !Number.isFinite(minOrder) ||
      !Number.isFinite(maxOrder) ||
      orderQuantity < minOrder ||
      orderQuantity > maxOrder
    ) {
      alert(
        `Invalid quantity! This service requires a quantity between ${minOrder.toLocaleString()} and ${maxOrder.toLocaleString()}.`
      );
      return;
    }

    if (totalPrice > walletBalance) {
      alert(
        `Insufficient wallet balance.\n\n` +
        `Order Amount: ₹${totalPrice.toFixed(2)}\n\n` +
        `Wallet Balance: ₹${walletBalance.toFixed(2)}\n\n` +
        `Please add funds.`
      );
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      alert("Session expired. Please login again.");
      window.location.replace("/");
      return;
    }

    // Keep these values before clearing the form.
    const submittedLink = link.trim();
    const submittedQuantity = orderQuantity;
    const submittedRate = Number(selectedService.rate);
    const submittedCharge = totalPrice;
    const submittedServiceId = selectedService.id;
    const submittedServiceName = selectedService.service;
    const previousBalance = walletBalance;

    try {
      setOrderLoading(true);

      const response = await axios.post(
        `${API_URL}/api/orders`,
        {
          serviceId: submittedServiceId,
          serviceName: submittedServiceName,
          category: selectedService.category,
          link: submittedLink,
          quantity: submittedQuantity,
          rate: submittedRate,
          amount: submittedCharge,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Support common response shapes from the backend.
      const responseData = response.data || {};
      const orderData =
        responseData.order ||
        responseData.data?.order ||
        responseData.data ||
        responseData;

      // Refresh the balance after the order is successfully created.
      const updatedBalance = await fetchWalletBalance();

      // Show the order confirmation.
      setOrderConfirmation({
        orderId:
          orderData.id ??
          orderData.orderId ??
          orderData.order_id ??
          orderData.insertId ??
          orderData.order?.id ??
          null,

        serviceId: submittedServiceId,
        serviceName: submittedServiceName || "Service",
        link: submittedLink,
        quantity: submittedQuantity,
        rate: submittedRate,
        charge: submittedCharge,
        amount: submittedCharge,

        balanceAmount:
          updatedBalance !== null
            ? updatedBalance
            : Math.max(0, previousBalance - submittedCharge),
      });

      // Reset the order form.
      setServiceId("");
      setLink("");
      setQuantity("");
    } catch (error) {
      console.error("Order error:", error);

      alert(
        error.response?.data?.message ||
        "Unable to place order."
      );
    } finally {
      setOrderLoading(false);
    }
  };

  // ==========================================
  // PAGE
  // ==========================================
  return (
    <>
      <Navbar />

      <div className="order-page">
        <main className="order-container">
          <div className="order-title">
            <p>Select a service and place a new order.</p>
          </div>

          {/* =====================================
              ORDER SUCCESS CONFIRMATION
          ===================================== */}
          {orderConfirmation && (
            <section
              className="order-success-card"
              role="status"
              aria-live="polite"
            >
              <div className="order-success-header">
                <div className="order-success-icon">✓</div>

                <div className="order-success-heading">
                  <h2>Order Placed Successfully!</h2>
                  <p>Your order has been submitted successfully.</p>
                </div>

                <button
                  type="button"
                  className="order-success-close"
                  onClick={() => setOrderConfirmation(null)}
                  aria-label="Close confirmation"
                >
                  ×
                </button>
              </div>

              <div className="order-success-details">
                <div className="success-detail">
                  <span>Order ID</span>
                  <strong>
                    {orderConfirmation.orderId != null
                      ? `#${orderConfirmation.orderId}`
                      : "Created successfully"}
                  </strong>
                </div>

                <div className="success-detail">
                  <span>Service</span>
                  <strong>
                    {orderConfirmation.serviceId} -{" "}
                    {orderConfirmation.serviceName}
                  </strong>
                </div>

                <div className="success-detail success-link">
                  <span>Link</span>
                  <a
                    href={orderConfirmation.link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {orderConfirmation.link}
                  </a>
                </div>

                <div className="success-detail">
                  <span>Quantity</span>
                  <strong>
                    {orderConfirmation.quantity.toLocaleString()}
                  </strong>
                </div>

                <div className="success-detail">
                  <span>Rate per 1,000</span>
                  <strong>
                    ₹{orderConfirmation.rate.toFixed(2)}
                  </strong>
                </div>

                <div className="success-detail">
                  <span>Charge</span>
                  <strong>
                    ₹{orderConfirmation.charge.toFixed(2)}
                  </strong>
                </div>

                <div className="success-detail">
                  <span>Amount Deducted</span>
                  <strong>
                    ₹{orderConfirmation.amount.toFixed(2)}
                  </strong>
                </div>

                <div className="success-detail success-balance">
                  <span>Remaining Balance</span>
                  <strong>
                    ₹{orderConfirmation.balanceAmount.toFixed(2)}
                  </strong>
                </div>
              </div>

              <button
                type="button"
                className="success-done-btn"
                onClick={() => setOrderConfirmation(null)}
              >
                Done
              </button>
            </section>
          )}

          <div className="order-layout">
            {/* =====================================
                ORDER FORM
            ===================================== */}
            <div className="order-form-card">
              <div className="card-heading">
                <div className="heading-icon">+</div>

                <div>
                  <h2>Create New Order</h2>
                  <p>Fill in the details below</p>
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                {/* CATEGORY */}
                <div className="form-group">
                  <label htmlFor="order-category">Category</label>

                  <select
                    id="order-category"
                    value={category}
                    onChange={(e) =>
                      handleCategoryChange(e.target.value)
                    }
                    disabled={servicesLoading}
                  >
                    {categories.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                {/* SERVICE */}
                <div className="form-group">
                  <label htmlFor="order-service">Service</label>

                  <select
                    id="order-service"
                    value={serviceId}
                    onChange={(e) =>
                      handleServiceChange(e.target.value)
                    }
                    disabled={servicesLoading}
                  >
                    <option value="">
                      {servicesLoading
                        ? "Loading services..."
                        : "Select a service"}
                    </option>

                    {filteredServices.map((service) => (
                      <option
                        key={service.id}
                        value={service.id}
                      >
                        {service.id} - {service.service} - ₹
                        {service.rate}
                      </option>
                    ))}
                  </select>
                </div>

                {/* SERVICE INFORMATION */}
                {selectedService && (
                  <div className="service-info">
                    <div className="service-info-header">
                      <span>Service #{selectedService.id}</span>

                      <span className="service-badge">
                        {selectedService.category}
                      </span>
                    </div>

                    <p>Description</p>
                    <h3>
                      {selectedService.description || "No description available"}
                    </h3>

                    <div className="service-limits">
                      <div>
                        <span>Rate per 1,000</span>
                        <strong>
                          ₹{Number(selectedService.rate).toFixed(2)}
                        </strong>
                      </div>

                      <div>
                        <span>Min Order</span>
                        <strong>
                          {minOrder.toLocaleString()}
                        </strong>
                      </div>

                      <div>
                        <span>Max Order</span>
                        <strong>
                          {maxOrder.toLocaleString()}
                        </strong>
                      </div>
                    </div>
                  </div>
                )}

                {/* LINK */}
                <div className="form-group">
                  <label htmlFor="order-link">Link</label>

                  <input
                    id="order-link"
                    type="text"
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    placeholder="Enter post, profile or video link"
                  />
                </div>

                {/* QUANTITY */}
                <div className="form-group">
                  <label htmlFor="order-quantity">Quantity</label>

                  <input
                    id="order-quantity"
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    min={selectedService ? minOrder : undefined}
                    max={selectedService ? maxOrder : undefined}
                    step="1"
                    placeholder={
                      selectedService
                        ? `${minOrder} - ${maxOrder}`
                        : "Enter quantity"
                    }
                  />
                </div>

                {/* INSUFFICIENT BALANCE */}
                {selectedService &&
                  quantity &&
                  insufficientBalance && (
                    <div className="wallet-warning">
                      <strong>Insufficient Wallet Balance</strong>

                      <p>
                        Order Amount: ₹{totalPrice.toFixed(2)}
                      </p>

                      <p>
                        Available Balance: ₹{walletBalance.toFixed(2)}
                      </p>

                      <a href="/add-funds">Add Funds →</a>
                    </div>
                  )}

                {/* DRIP FEED - UI ONLY */}
                <div className="checkbox-row">
                  <input type="checkbox" id="drip" />
                  <label htmlFor="drip">Enable Drip-feed</label>
                </div>

                {/* PLACE ORDER */}
                <button
                  type="submit"
                  className="place-order-btn"
                  disabled={
                    orderLoading ||
                    walletLoading ||
                    servicesLoading ||
                    !selectedService ||
                    insufficientBalance
                  }
                >
                  {orderLoading
                    ? "Placing Order..."
                    : insufficientBalance
                    ? "Insufficient Balance"
                    : "Place Order"}
                </button>
              </form>
            </div>

            {/* =====================================
                ORDER SUMMARY
            ===================================== */}
            <aside className="order-summary">
              <div className="summary-card">
                <div className="summary-title">
                  <h2>Order Summary</h2>
                  <span>₹</span>
                </div>

                <div className="summary-line">
                  <span>Service</span>
                  <strong>
                    {selectedService
                      ? `#${selectedService.id}`
                      : "—"}
                  </strong>
                </div>

                <div className="summary-line">
                  <span>Category</span>
                  <strong>
                    {selectedService
                      ? selectedService.category
                      : "—"}
                  </strong>
                </div>

                <div className="summary-line">
                  <span>Quantity</span>
                  <strong>
                    {quantity
                      ? Number(quantity).toLocaleString()
                      : "—"}
                  </strong>
                </div>

                <div className="summary-line">
                  <span>Rate per 1,000</span>
                  <strong>
                    {selectedService
                      ? `₹${Number(selectedService.rate).toFixed(2)}`
                      : "—"}
                  </strong>
                </div>

                <div className="summary-divider" />

                <div className="total-row">
                  <span>Total</span>
                  <strong>₹{totalPrice.toFixed(2)}</strong>
                </div>

                <div className="summary-line">
                  <span>Wallet Balance</span>
                  <strong>
                    {walletLoading
                      ? "Loading..."
                      : `₹${walletBalance.toFixed(2)}`}
                  </strong>
                </div>

                {selectedService &&
                  quantity &&
                  !insufficientBalance && (
                    <div className="remaining-balance">
                      Remaining Balance:{" "}
                      <strong>
                        ₹{(walletBalance - totalPrice).toFixed(2)}
                      </strong>
                    </div>
                  )}

                <button
                  type="button"
                  className="summary-order-btn"
                  onClick={handleSubmit}
                  disabled={
                    orderLoading ||
                    walletLoading ||
                    servicesLoading ||
                    !selectedService ||
                    insufficientBalance
                  }
                >
                  {orderLoading
                    ? "Processing..."
                    : insufficientBalance
                    ? "Insufficient Balance"
                    : "Confirm Order"}
                </button>
              </div>

              {/* WALLET CARD */}
              <div className="balance-card">
                <div className="balance-icon">₹</div>

                <div>
                  <span>Available Balance</span>
                  <strong>
                    {walletLoading
                      ? "Loading..."
                      : `₹${walletBalance.toFixed(2)}`}
                  </strong>
                </div>
              </div>

              {/* HELP */}
              <div className="help-card">
                <h3>Need help?</h3>

                <p>
                  Make sure your link is public and the quantity is
                  within the allowed limits.
                </p>

                <a href="/support">Contact Support →</a>
              </div>
            </aside>
          </div>
        </main>

        <WhatsAppButton />
      </div>
    </>
  );
}

export default NewOrder;
