
import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/AdminUsers.css";

const API_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000";

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingUserId, setUpdatingUserId] = useState(null);

  // Wallet fund management
  const [selectedUser, setSelectedUser] = useState(null);
  const [fundAction, setFundAction] = useState("ADD");
  const [fundAmount, setFundAmount] = useState("");
  const [fundReason, setFundReason] = useState("");
  const [fundLoading, setFundLoading] = useState(false);
  const [fundMessage, setFundMessage] = useState("");
  const [fundError, setFundError] = useState("");

  const getToken = () => localStorage.getItem("token");

  // ============================================
  // FETCH USERS
  // ============================================

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const token = getToken();

      if (!token) {
        setError("Authentication required. Please login again.");
        return;
      }

      const response = await axios.get(
        `${API_URL}/api/admin/users`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setUsers(response.data.users || []);
    } catch (err) {
      console.error("Fetch users error:", err);
      setError(
        err.response?.data?.message || "Unable to fetch users."
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // DISCONTINUE / REACTIVATE USER
  // ============================================

  const handleUserStatus = async (user) => {
    const currentStatus = user.account_status || "Active";
    const newStatus =
      currentStatus.toLowerCase() === "discontinued"
        ? "Active"
        : "Discontinued";

    const action =
      newStatus === "Active" ? "reactivate" : "discontinue";

    if (
      !window.confirm(
        `Are you sure you want to ${action} ${user.username}'s account?`
      )
    ) {
      return;
    }

    try {
      setUpdatingUserId(user.id);

      const response = await axios.patch(
        `${API_URL}/api/admin/users/${user.id}/status`,
        { status: newStatus },
        {
          headers: { Authorization: `Bearer ${getToken()}` },
        }
      );

      const updatedStatus =
        response.data.user?.account_status || newStatus;

      setUsers((previous) =>
        previous.map((item) =>
          item.id === user.id
            ? { ...item, account_status: updatedStatus }
            : item
        )
      );

      window.alert(response.data.message || "User status updated.");
    } catch (err) {
      window.alert(
        err.response?.data?.message ||
          "Unable to update user status."
      );
    } finally {
      setUpdatingUserId(null);
    }
  };

  // ============================================
  // OPEN / CLOSE FUND MODAL
  // ============================================

  const openFundModal = (user) => {
    setSelectedUser(user);
    setFundAction("ADD");
    setFundAmount("");
    setFundReason("");
    setFundMessage("");
    setFundError("");
  };

  const closeFundModal = () => {
    if (fundLoading) return;
    setSelectedUser(null);
    setFundMessage("");
    setFundError("");
  };

  // ============================================
  // ADD / DEDUCT USER FUNDS
  // ============================================

  const handleUpdateFunds = async (e) => {
    e.preventDefault();

    if (!selectedUser) return;

    const amount = Number(fundAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setFundError("Enter an amount greater than zero.");
      return;
    }

    if (Math.round(amount * 100) !== amount * 100) {
      setFundError("Amount can have a maximum of 2 decimal places.");
      return;
    }

    if (
      fundAction === "DEDUCT" &&
      amount > Number(selectedUser.balance || 0)
    ) {
      setFundError("Deduction cannot exceed the displayed balance.");
      return;
    }

    const actionLabel =
      fundAction === "ADD" ? "add to" : "deduct from";

    if (
      !window.confirm(
        `Confirm ₹${amount.toFixed(2)} ${actionLabel} ${selectedUser.username}'s wallet?`
      )
    ) {
      return;
    }

    try {
      setFundLoading(true);
      setFundError("");
      setFundMessage("");

      const response = await axios.post(
        `${API_URL}/api/admin/users/${selectedUser.id}/funds`,
        {
          amount,
          action: fundAction,
          reason: fundReason.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );

      const newBalance = Number(response.data.wallet.balance);

      // Update the row immediately using the backend balance.
      setUsers((previous) =>
        previous.map((user) =>
          user.id === selectedUser.id
            ? { ...user, balance: newBalance }
            : user
        )
      );

      setSelectedUser((previous) =>
        previous
          ? { ...previous, balance: newBalance }
          : previous
      );

      setFundAmount("");
      setFundReason("");
      setFundMessage(
        response.data.message || "Wallet updated successfully."
      );
    } catch (err) {
      console.error("Update user funds error:", err);

      setFundError(
        err.response?.data?.message ||
          "Unable to update wallet funds."
      );
    } finally {
      setFundLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // ============================================
  // LOADING
  // ============================================

  if (loading) {
    return (
      <div className="admin-users-page">
        <div className="users-loading">Loading users...</div>
      </div>
    );
  }

  // ============================================
  // ERROR
  // ============================================

  if (error) {
    return (
      <div className="admin-users-page">
        <div className="users-header">
          <div>
            <h1>Users</h1>
            <p>Manage registered users</p>
          </div>
        </div>

        <div className="users-error">
          <h3>Unable to load users</h3>
          <p>{error}</p>
          <button onClick={fetchUsers}>Retry</button>
        </div>
      </div>
    );
  }

  // ============================================
  // PAGE
  // ============================================

  return (
    <div className="admin-users-page">
      <div className="users-header">
        <div>
          <h1>Users</h1>
          <p>Manage all registered users and wallet funds</p>
        </div>

        <div className="users-header-right">
          <div className="users-count">
            <span>Total Users</span>
            <strong>{users.length}</strong>
          </div>

          <button
            className="refresh-users-btn"
            onClick={fetchUsers}
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      <div className="users-card">
        <div className="users-table-wrapper">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Username</th>
                <th>Wallet Funds</th>
                <th>WhatsApp</th>
                <th>Email</th>
                <th>Created At</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan="8" className="no-users">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const discontinued =
                    String(user.account_status || "Active").toLowerCase() ===
                    "discontinued";

                  return (
                    <tr key={user.id}>
                      <td>
                        <span className="user-id">#{user.id}</span>
                      </td>

                      <td>
                        <div className="user-profile">
                          <div className="user-avatar">
                            {user.username?.charAt(0).toUpperCase()}
                          </div>
                          <strong>{user.username}</strong>
                        </div>
                      </td>

                      <td>
                        <span className="wallet-balance">
                          ₹
                          {Number(user.balance || 0).toLocaleString(
                            "en-IN",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          )}
                        </span>
                      </td>

                      <td>{user.whatsapp || "—"}</td>
                      <td>{user.email || "—"}</td>

                      <td>
                        {user.created_at
                          ? new Date(user.created_at).toLocaleString()
                          : "—"}
                      </td>

                      <td>
                        <span
                          className={
                            discontinued
                              ? "status-discontinued"
                              : "status-active"
                          }
                        >
                          {user.account_status || "Active"}
                        </span>
                      </td>

                      <td>
                        <div className="user-action-buttons">
                          <button
                            type="button"
                            className="manage-funds-btn"
                            onClick={() => openFundModal(user)}
                          >
                            Manage Funds
                          </button>

                          <button
                            type="button"
                            className={
                              discontinued
                                ? "reactivate-user-btn"
                                : "discontinue-user-btn"
                            }
                            disabled={updatingUserId === user.id}
                            onClick={() => handleUserStatus(user)}
                          >
                            {updatingUserId === user.id
                              ? "Updating..."
                              : discontinued
                              ? "Reactivate"
                              : "Discontinue"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================
          MANAGE FUNDS MODAL
      ============================================ */}

      {selectedUser && (
        <div
          className="fund-modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeFundModal();
          }}
        >
          <section
            className="fund-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="fund-modal-title"
          >
            <div className="fund-modal-header">
              <div>
                <h2 id="fund-modal-title">Manage User Funds</h2>
                <p>
                  {selectedUser.username} · User #{selectedUser.id}
                </p>
              </div>

              <button
                type="button"
                className="fund-modal-close"
                onClick={closeFundModal}
                disabled={fundLoading}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="fund-current-balance">
              <span>Current wallet balance</span>
              <strong>
                ₹
                {Number(selectedUser.balance || 0).toLocaleString(
                  "en-IN",
                  {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }
                )}
              </strong>
            </div>

            <form onSubmit={handleUpdateFunds}>
              <div className="fund-form-group">
                <label>Transaction type</label>

                <div className="fund-action-options">
                  <button
                    type="button"
                    className={
                      fundAction === "ADD"
                        ? "fund-action-btn add selected"
                        : "fund-action-btn add"
                    }
                    onClick={() => {
                      setFundAction("ADD");
                      setFundError("");
                    }}
                    disabled={fundLoading}
                  >
                    + Add Funds
                  </button>

                  <button
                    type="button"
                    className={
                      fundAction === "DEDUCT"
                        ? "fund-action-btn deduct selected"
                        : "fund-action-btn deduct"
                    }
                    onClick={() => {
                      setFundAction("DEDUCT");
                      setFundError("");
                    }}
                    disabled={fundLoading}
                  >
                    − Deduct Funds
                  </button>
                </div>
              </div>

              <div className="fund-form-group">
                <label htmlFor="fund-amount">Amount (₹)</label>
                <input
                  id="fund-amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={fundAmount}
                  onChange={(e) => {
                    setFundAmount(e.target.value);
                    setFundError("");
                  }}
                  placeholder="Enter amount"
                  required
                  disabled={fundLoading}
                />
              </div>

              <div className="fund-form-group">
                <label htmlFor="fund-reason">Reason</label>
                <textarea
                  id="fund-reason"
                  value={fundReason}
                  onChange={(e) => setFundReason(e.target.value)}
                  placeholder="Enter reason for this adjustment"
                  rows="3"
                  maxLength="250"
                  disabled={fundLoading}
                />
              </div>

              {fundError && (
                <div className="fund-feedback error" role="alert">
                  {fundError}
                </div>
              )}

              {fundMessage && (
                <div className="fund-feedback success" role="status">
                  {fundMessage}
                </div>
              )}

              <div className="fund-modal-actions">
                <button
                  type="button"
                  className="fund-cancel-btn"
                  onClick={closeFundModal}
                  disabled={fundLoading}
                >
                  Close
                </button>

                <button
                  type="submit"
                  className={
                    fundAction === "ADD"
                      ? "fund-submit-btn add"
                      : "fund-submit-btn deduct"
                  }
                  disabled={fundLoading || !fundAmount}
                >
                  {fundLoading
                    ? "Processing..."
                    : fundAction === "ADD"
                    ? "Confirm Add"
                    : "Confirm Deduction"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

export default AdminUsers;
