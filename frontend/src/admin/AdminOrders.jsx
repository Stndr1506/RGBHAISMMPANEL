import React, { useEffect, useState } from "react";
import axios from "axios";
import '../styles/AdminOrders.css';

function AdminOrders() {

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  // =====================================================
  // FETCH ORDERS
  // =====================================================

  const fetchOrders = async () => {

    try {

      setLoading(true);
      setError("");

      const token =
        localStorage.getItem("token");

      if (!token) {
        setError("Authentication required");
        return;
      }


      const response = await axios.get(
        "http://localhost:5000/api/admin/orders",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );


      console.log(
        "Admin Orders:",
        response.data
      );


      setOrders(
        response.data.orders || []
      );


    } catch (error) {

      console.error(
        "Fetch orders error:",
        error
      );

      setError(
        error.response?.data?.message ||
        "Unable to fetch orders"
      );

    } finally {

      setLoading(false);

    }
  };


  // =====================================================
  // LOAD
  // =====================================================

  useEffect(() => {

    fetchOrders();

  }, []);


  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {

    return (
      <div className="admin-orders-page">
        <h2>Loading orders...</h2>
      </div>
    );

  }


  // =====================================================
  // ERROR
  // =====================================================

  if (error) {

    return (
      <div className="admin-orders-page">

        <h2>Orders</h2>

        <p>
          {error}
        </p>

        <button
          onClick={fetchOrders}
        >
          Retry
        </button>

      </div>
    );

  }


  // =====================================================
  // UI
  // =====================================================

  return (

    <div className="admin-orders-page">

      <div className="orders-header">

        <div>

          <h1>
            Orders
          </h1>

          <p>
            Manage all customer orders
          </p>

        </div>

        <button
          onClick={fetchOrders}
        >
          Refresh
        </button>

      </div>


      <div className="orders-card">

        <table>

          <thead>

            <tr>

              <th>
                Order ID
              </th>

              <th>
                User
              </th>

              <th>
                Service
              </th>

              <th>
                Category
              </th>

              <th>
                Link
              </th>

              <th>
                Quantity
              </th>

              <th>
                Rate / 1000
              </th>

              <th>
                Amount
              </th>

              <th>
                Status
              </th>

              <th>
                Date
              </th>

            </tr>

          </thead>


          <tbody>

            {orders.length === 0 ? (

              <tr>

                <td
                  colSpan="10"
                >
                  No orders found
                </td>

              </tr>

            ) : (

              orders.map((order) => (

                <tr
                  key={order.id}
                >

                  <td>
                    #{order.id}
                  </td>


                  <td>

                    <strong>
                      {order.username}
                    </strong>

                    <br />

                    <small>
                      {order.email}
                    </small>

                  </td>


                  <td>
                    {order.service_name}
                  </td>


                  <td>
                    {order.category}
                  </td>


                  <td>

                    <a
                      href={order.link}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View Link
                    </a>

                  </td>


                  <td>
                    {Number(
                      order.quantity
                    ).toLocaleString()}
                  </td>


                  <td>
                    ₹
                    {Number(
                      order.rate
                    ).toFixed(2)}
                  </td>


                  <td>

                    <strong>
                      ₹
                      {Number(
                        order.amount
                      ).toFixed(2)}
                    </strong>

                  </td>


                  <td>

                    <span
                      className={`status ${order.status
                        ?.toLowerCase()
                        .replace(/\s+/g, "-")}`}
                    >
                      {order.status}
                    </span>

                  </td>


                  <td>

                    {new Date(
                      order.created_at
                    ).toLocaleString()}

                  </td>

                </tr>

              ))

            )}

          </tbody>

        </table>

      </div>

    </div>

  );
}

export default AdminOrders;