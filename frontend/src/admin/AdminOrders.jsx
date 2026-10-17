
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Pencil, X, Save, RefreshCw } from "lucide-react";
import "../styles/AdminOrders.css";

import AdminNavbar from "../components/AdminNavbar";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

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
    .replace("cancelled", "canceled")
    .trim();

const getServiceName = (order) =>
  order.service_name ||
  order.serviceName ||
  order.service?.service ||
  (typeof order.service === "string" ? order.service : "Service");

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [editingOrder, setEditingOrder] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [newStartCount, setNewStartCount] = useState("");

  const [saving, setSaving] = useState(false);
  const [savingStartCount, setSavingStartCount] = useState(false);
  const [editError, setEditError] = useState("");

  const fetchOrders = useCallback(async (showRefresh = false) => {
    const token = localStorage.getItem("token");

    if (!token) {
      setOrders([]);
      setError("Please log in to view orders.");
      setLoading(false);
      setRefreshing(false);
      return;
    }

    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const response = await fetch(`${API_URL}/api/admin/orders`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch orders.");
      }

      const orderList = Array.isArray(data)
        ? data
        : data.orders || [];

      setOrders(Array.isArray(orderList) ? orderList : []);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const filteredOrders = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesStatus =
        selectedStatus === "All" ||
        normalizeStatus(order.status) === normalizeStatus(selectedStatus);

      const searchableValues = [
        order.id,
        order.link,
        getServiceName(order),
      ];

      const matchesSearch =
        !query ||
        searchableValues.some((value) =>
          String(value ?? "").toLowerCase().includes(query)
        );

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

    return Number.isFinite(value) ? `₹${value.toFixed(2)}` : "—";
  };

  const openEditModal = (order) => {
    setEditingOrder(order);

    setNewStatus(
      EDITABLE_STATUSES.find(
        (status) =>
          normalizeStatus(status) === normalizeStatus(order.status)
      ) || "Pending"
    );

    setNewStartCount(
      String(order.start_count ?? order.startCount ?? "")
    );

    setEditError("");
    setSuccessMessage("");
  };

  const closeEditModal = () => {
    if (saving || savingStartCount) return;

    setEditingOrder(null);
    setNewStatus("");
    setNewStartCount("");
    setEditError("");
  };

  const updateLocalOrder = (orderId, changes) => {
    setOrders((previousOrders) =>
      previousOrders.map((order) =>
        String(order.id) === String(orderId)
          ? { ...order, ...changes }
          : order
      )
    );

    setEditingOrder((previous) =>
      previous && String(previous.id) === String(orderId)
        ? { ...previous, ...changes }
        : previous
    );
  };

  const saveOrderStatus = async (event) => {
    event.preventDefault();

    if (!editingOrder || !newStatus) return;

    if (
      normalizeStatus(editingOrder.status) === normalizeStatus(newStatus)
    ) {
      setEditError("Please select a different status.");
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      setEditError("Please log in again.");
      return;
    }

    try {
      setSaving(true);
      setEditError("");
      setSuccessMessage("");

      const response = await fetch(
        `${API_URL}/api/admin/orders/${editingOrder.id}/status`,
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

      const updatedStatus =
        data.order?.status ?? data.status ?? newStatus;

      updateLocalOrder(editingOrder.id, { status: updatedStatus });

      setSuccessMessage(
        `Order #${editingOrder.id} status updated successfully.`
      );

      setEditingOrder(null);
      setNewStatus("");
      setNewStartCount("");
    } catch (err) {
      setEditError(err.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  const saveStartCount = async () => {
    if (!editingOrder) return;

    const value = String(newStartCount).trim();

    if (value === "") {
      setEditError("Please enter a start count.");
      return;
    }

    const startCount = Number(value);

    if (!Number.isSafeInteger(startCount) || startCount < 0) {
      setEditError(
        "Start count must be a non-negative whole number."
      );
      return;
    }

    const currentCount = Number(
      editingOrder.start_count ?? editingOrder.startCount
    );

    if (
      value !== "" &&
      Number.isSafeInteger(currentCount) &&
      currentCount === startCount
    ) {
      setEditError("The start count has not changed.");
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      setEditError("Please log in again.");
      return;
    }

    try {
      setSavingStartCount(true);
      setEditError("");
      setSuccessMessage("");

      const response = await fetch(
        `${API_URL}/api/admin/orders/${editingOrder.id}/start-count`, 
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ start_count: startCount }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to update start count."
        );
      }

      const savedCount =
        data.order?.start_count ??
        data.start_count ??
        startCount;

      updateLocalOrder(editingOrder.id, {
        start_count: savedCount,
        startCount: savedCount,
      });

      setNewStartCount(String(savedCount));
      setSuccessMessage(
        `Order #${editingOrder.id} start count updated successfully.`
      );
    } catch (err) {
      setEditError(err.message || "Something went wrong.");
    } finally {
      setSavingStartCount(false);
    }
  };

  return (
    <>
    <AdminNavbar/>
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
        <div className="admin-orders-toolbar">
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

          <button
            type="button"
            className="admin-orders-refresh-btn"
            onClick={() => fetchOrders(true)}
            disabled={loading || refreshing}
          >
            <RefreshCw
              size={16}
              className={refreshing ? "admin-orders-spinning" : ""}
            />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {successMessage && (
          <div className="admin-order-success" role="status">
            <span>{successMessage}</span>
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
          <div className="orders-message orders-error">
            {error}
            <button
              type="button"
              onClick={() => fetchOrders()}
            >
              Try again
            </button>
          </div>
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
                    const statusClass = normalizeStatus(order.status)
                      .replace(/\s+/g, "-");

                    return (
                      <tr key={order.id}>
                        <td data-label="ID">#{order.id}</td>

                        <td data-label="Date">
                          {formatDate(
                            order.created_at ??
                              order.createdAt ??
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

                        <td data-label="Service">
                          {getServiceName(order)}
                        </td>

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
                  <p>
                    Try changing your status filter or search term.
                  </p>
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
                <h2 id="edit-order-title">Edit Order</h2>
                <p>Order #{editingOrder.id}</p>
              </div>

              <button
                type="button"
                className="admin-order-close-btn"
                onClick={closeEditModal}
                disabled={saving || savingStartCount}
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
                  disabled={saving || savingStartCount}
                  required
                >
                  {EDITABLE_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>

                <p className="admin-order-current-status">
                  Current status:{" "}
                  <strong>{editingOrder.status || "Unknown"}</strong>
                </p>

                <div className="admin-order-start-count-field">
                  <label htmlFor="order-start-count">
                    Start count
                  </label>

                  <input
                    id="order-start-count"
                    type="number"
                    min="0"
                    step="1"
                    value={newStartCount}
                    onChange={(event) =>
                      setNewStartCount(event.target.value)
                    }
                    disabled={saving || savingStartCount}
                    placeholder="Enter start count"
                  />

                  <button
                    type="button"
                    className="admin-order-save-btn"
                    onClick={saveStartCount}
                    disabled={saving || savingStartCount}
                  >
                    {savingStartCount ? (
                      <>
                        <RefreshCw size={16} />
                        Saving count...
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        Save Start Count
                      </>
                    )}
                  </button>
                </div>

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
                  disabled={saving || savingStartCount}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="admin-order-save-btn"
                  disabled={saving || savingStartCount}
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
    </>
  );
};

export default AdminOrders;
