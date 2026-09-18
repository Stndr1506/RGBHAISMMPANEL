import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/Payments.css";

function Payments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError("");
      
      const token =
        localStorage.getItem("token");


      if (!token) {

        setError(
          "Authentication required. Please login again."
        );

        return;
      }

      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/admin/payments`,
      {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Payment API Response:", response.data);

      if (response.data.success) {
        setPayments(response.data.data);
      } else {
        setError("Failed to fetch payments");
      }

    } catch (err) {
      console.error("Payment fetch error:", err);

      setError(
        err.response?.data?.message ||
        "Unable to fetch payments"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  return (
    <div className="payments-container">

      <div className="payments-header">
        <h2>Payment Details</h2>

        <button onClick={fetchPayments}>
          Refresh
        </button>
      </div>

      {loading && (
        <div className="loading">
          Loading payments...
        </div>
      )}

      {error && (
        <div className="error">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="table-wrapper">

          <table className="payments-table">

            <thead>
              <tr>
                <th>#</th>
                <th>Username</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Transaction ID</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>

              {payments.length === 0 ? (
                <tr>
                  <td colSpan="6">
                    No payments found
                  </td>
                </tr>
              ) : (

                payments.map((payment, index) => (

                  <tr key={payment.id}>

                    <td>
                      {index + 1}
                    </td>

                    <td>
                      {payment.username}
                    </td>

                    <td>
                      ₹{Number(payment.amount).toFixed(2)}
                    </td>

                    <td>
                      {new Date(
                        payment.created_at
                      ).toLocaleString("en-IN")}
                    </td>

                    <td>
                      {payment.gateway_payment_id ||
                        payment.utr ||
                        payment.gateway_order_id ||
                        "-"}
                    </td>

                    <td>
                      {payment.status}
                    </td>

                  </tr>

                ))

              )}

            </tbody>

          </table>

        </div>
      )}

    </div>
  );
}

export default Payments;