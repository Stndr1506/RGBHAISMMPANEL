
import React, { useEffect, useMemo, useState } from "react";
import "../styles/Orders.css";

// const API_URL = process.env.REACT_APP_API_URL;

const ORDER_STATUSES = [
  "All",
  "Pending",
  "In progress",
  "Completed",
  "Partial",
  "Processing",
  "Cancelled",
];

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch orders for the logged-in user
  useEffect(() => {
    const controller = new AbortController();

    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("token");

        if (!token) {
          setOrders([]);
          setError("Please log in to view your orders.");
          return;
        }

        const response = await fetch(`http://localhost:5000/api/user-orders`, {   //${API_URL}
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          signal: controller.signal,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to fetch orders."
          );
        }

        const orderList = Array.isArray(data)
          ? data
          : data.orders || [];

        setOrders(Array.isArray(orderList) ? orderList : []);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Error fetching orders:", err);
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

  // Filter orders by status and search term
  const filteredOrders = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return orders.filter((order) => {
      const orderStatus = String(order.status || "")
        .toLowerCase()
        .replace(/[_-]+/g, " ")
        .trim();

      const activeStatus = selectedStatus
        .toLowerCase()
        .trim();

      const matchesStatus =
        activeStatus === "all" ||
        orderStatus === activeStatus;

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

  // Format order date
  const formatDate = (date) => {
    if (!date) return "—";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "—";
    }

    return parsedDate.toLocaleDateString("en-IN");
  };

  // Format currency
  const formatCharge = (amount) => {
    if (amount === null || amount === undefined || amount === "") {
      return "—";
    }

    const value = Number(amount);

    return Number.isFinite(value)
      ? `₹${value.toFixed(2)}`
      : "—";
  };

  return (
    <main className="orders-page">
      {/* Status Filters */}
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

      {/* Orders Table Card */}
      <section className="orders-card">
        {/* Search */}
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
            <span aria-hidden="true">⌕</span>
          </button>
        </form>

        {/* Loading State */}
        {loading && (
          <div className="orders-message">
            Loading orders...
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="orders-message orders-error">
            {error}
          </div>
        )}

        {/* Orders Table */}
        {!loading && !error && (
          <>
            <p className="orders-results-count">
              {filteredOrders.length} order
              {filteredOrders.length !== 1 ? "s" : ""} found
            </p>

            <div className="orders-table-wrapper">
              <table className="orders-table">
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

                    const statusClass = String(order.status || "unknown")
                      .toLowerCase()
                      .replace(/[_\s]+/g, "-");

                    return (
                      <tr key={order.id}>
                        <td data-label="ID">
                          #{order.id}
                        </td>

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
                          {formatCharge(
                            order.amount ?? order.charge
                          )}
                        </td>

                        <td data-label="Start count">
                          {order.start_count ??
                            order.startCount ??
                            "—"}
                        </td>

                        <td data-label="Quantity">
                          {order.quantity ?? "—"}
                        </td>

                        <td data-label="Service">
                          {serviceName}
                        </td>

                        <td data-label="Status">
                          <span
                            className={`orders-status status-${statusClass}`}
                          >
                            {order.status || "Unknown"}
                          </span>
                        </td>

                        <td data-label="Remains">
                          {order.remains ??
                            order.remain ??
                            "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Empty State */}
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
    </main>
  );
};

export default Orders;