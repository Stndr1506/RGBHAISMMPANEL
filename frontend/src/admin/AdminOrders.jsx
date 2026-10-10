
import React, { useEffect, useMemo, useState } from "react";
import { Pencil, X, Save, RefreshCw } from "lucide-react";
import "../styles/AdminOrders.css";

const API_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000";

const ORDER_STATUSES = [
  "All",
  "Pending",
  "In progress",
  "Processing",
  "Completed",
  "Partial",
  "Canceled",
];

const EDITABLE_STATUSES = ORDER_STATUSES.filter(
  (status) => status !== "All"
);

const normalizeStatus = (status) =>
  String(status || "")
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .trim()
    .replace("cancelled", "canceled");

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editingOrder, setEditingOrder] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("token");

        if (!token) {
          setOrders([]);
          setError("Please log in to view orders.");
          return;
        }

        const response = await fetch(
          `${API_URL}/api/admin/orders`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
            signal: controller.signal,
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch orders.");
        }

        const orderList = Array.isArray(data)
          ? data
          : data.orders || [];

        setOrders(Array.isArray(orderList) ? orderList : []);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message || "Something went wrong.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchOrders();

    return () => controller.abort();
  }, []);

  const filteredOrders = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesStatus =
        selectedStatus === "All" ||
        normalizeStatus(order.status) ===
          normalizeStatus(selectedStatus);

      const serviceName =
        order.service_name ||
        order.serviceName ||
        order.service?.service ||
        (typeof order.service === "string"
          ? order.service
          : "");

      const matchesSearch =
        !query ||
        String(order.id || "").toLowerCase().includes(query) ||
        String(order.link || "").toLowerCase().includes(query) ||
        String(serviceName).toLowerCase().includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [orders, selectedStatus, searchTerm]);

  const formatDate = (date) => {
    if (!date) return "—";

    const parsedDate = new Date(date);

    return Number.isNaN(parsedDate.getTime())
      ? "—"
      : parsedDate.toLocaleDateString("en-IN");
  };

  const formatCharge = (amount) => {
    if (amount === null || amount === undefined || amount === "") {
      return "—";
    }

    const value = Number(amount);

    return Number.isFinite(value)
      ? `₹${value.toFixed(2)}`
      : "—";
  };

  const openEditModal = (order) => {
    setEditingOrder(order);
    setNewStatus(
      EDITABLE_STATUSES.find(
        (status) =>
          normalizeStatus(status) === normalizeStatus(order.status)
      ) || "Pending"
    );
    setEditError("");
    setSuccessMessage("");
  };

  const closeEditModal = () => {
    if (saving) return;

    setEditingOrder(null);
    setNewStatus("");
    setEditError("");
  };

  const saveOrderStatus = async (event) => {
    event.preventDefault();

    if (!editingOrder || !newStatus) return;

    if (normalizeStatus(editingOrder.status) === normalizeStatus(newStatus)) {
      setEditError("Please select a different status.");
      return;
    }

    try {
      setSaving(true);
      setEditError("");
      setSuccessMessage("");

      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Please log in again.");
      }

      const response = await fetch(
        `http://localhost:5000/api/admin/orders/${editingOrder.id}/status`,  //${API_URL}
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to update order status."
        );
      }

      const updatedStatus = data.order?.status || data.status || newStatus;

      setOrders((previousOrders) =>
        previousOrders.map((order) =>
          String(order.id) === String(editingOrder.id)
            ? { ...order, status: updatedStatus }
            : order
        )
      );

      setSuccessMessage(
        `Order #${editingOrder.id} status updated successfully.`
      );
      setEditingOrder(null);
      setNewStatus("");
    } catch (err) {
      setEditError(err.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="orders-page admin-orders-page">
      <div className="orders-status-filters">
        {ORDER_STATUSES.map((status) => (
          <button
            key={status}
            type="button"
            className={`orders-filter ${
              selectedStatus === status ? "active" : ""
            }`}
            onClick={() => setSelectedStatus(status)}
          >
            {status}
          </button>
        ))}
      </div>

      <section className="orders-card">
        <form
          className="orders-search"
          onSubmit={(event) => event.preventDefault()}
        >
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by order ID, link or service"
            aria-label="Search orders"
          />

          <button type="submit" aria-label="Search">
            ⌕
          </button>
        </form>

        {successMessage && (
          <div className="admin-order-success" role="status">
            {successMessage}
            <button
              type="button"
              onClick={() => setSuccessMessage("")}
              aria-label="Dismiss message"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {loading && (
          <div className="orders-message">Loading orders...</div>
        )}

        {!loading && error && (
          <div className="orders-message orders-error">{error}</div>
        )}

        {!loading && !error && (
          <>
            <p className="orders-results-count">
              {filteredOrders.length} order
              {filteredOrders.length !== 1 ? "s" : ""} found
            </p>

            <div className="orders-table-wrapper">
              <table className="orders-table admin-orders-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Date</th>
                    <th>Link</th>
                    <th>Charge</th>
                    <th>Start count</th>
                    <th>Quantity</th>
                    <th>Service</th>
                    <th>Status</th>
                    <th>Remains</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredOrders.map((order) => {
                    const serviceName =
                      order.service_name ||
                      order.serviceName ||
                      order.service?.service ||
                      (typeof order.service === "string"
                        ? order.service
                        : "Service");

                    const statusClass = normalizeStatus(order.status)
                      .replace(/\s+/g, "-");

                    return (
                      <tr key={order.id}>
                        <td data-label="ID">#{order.id}</td>

                        <td data-label="Date">
                          {formatDate(
                            order.created_at ||
                              order.createdAt ||
                              order.date
                          )}
                        </td>

                        <td data-label="Link">
                          {order.link ? (
                            <a
                              href={order.link}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Open link
                            </a>
                          ) : (
                            "—"
                          )}
                        </td>

                        <td data-label="Charge">
                          {formatCharge(order.amount ?? order.charge)}
                        </td>

                        <td data-label="Start count">
                          {order.start_count ?? order.startCount ?? "—"}
                        </td>

                        <td data-label="Quantity">
                          {order.quantity ?? "—"}
                        </td>

                        <td data-label="Service">{serviceName}</td>

                        <td data-label="Status">
                          <span
                            className={`orders-status status-${statusClass}`}
                          >
                            {order.status || "Unknown"}
                          </span>
                        </td>

                        <td data-label="Remains">
                          {order.remains ?? order.remain ?? "—"}
                        </td>

                        <td data-label="Action">
                          <button
                            type="button"
                            className="admin-order-edit-btn"
                            onClick={() => openEditModal(order)}
                            title={`Edit order #${order.id}`}
                          >
                            <Pencil size={15} />
                            <span>Edit</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {filteredOrders.length === 0 && (
                <div className="orders-empty">
                  <h3>No orders found</h3>
                  <p>Try changing your status filter or search term.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedStatus("All");
                      setSearchTerm("");
                    }}
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </section>

      {editingOrder && (
        <div
          className="admin-order-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeEditModal();
            }
          }}
        >
          <section
            className="admin-order-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-order-title"
          >
            <div className="admin-order-modal-header">
              <div>
                <h2 id="edit-order-title">Edit Order Status</h2>
                <p>Order #{editingOrder.id}</p>
              </div>

              <button
                type="button"
                className="admin-order-close-btn"
                onClick={closeEditModal}
                disabled={saving}
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={saveOrderStatus}>
              <div className="admin-order-modal-body">
                <label htmlFor="order-status">Order status</label>

                <select
                  id="order-status"
                  value={newStatus}
                  onChange={(event) => setNewStatus(event.target.value)}
                  disabled={saving}
                  required
                >
                  {EDITABLE_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>

                <p className="admin-order-current-status">
                  Current status: <strong>{editingOrder.status}</strong>
                </p>

                {editError && (
                  <p className="admin-order-edit-error" role="alert">
                    {editError}
                  </p>
                )}
              </div>

              <div className="admin-order-modal-actions">
                <button
                  type="button"
                  className="admin-order-cancel-btn"
                  onClick={closeEditModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="admin-order-save-btn"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <RefreshCw size={16} />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      Save Status
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
};

export default AdminOrders;