import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/AdminUsers.css";

function AdminUsers() {

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  // =====================================================
  // FETCH USERS
  // =====================================================

  const fetchUsers = async () => {

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
        "http://localhost:5000/api/admin/users",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );


      console.log(
        "Users response:",
        response.data
      );


      setUsers(
        response.data.users || []
      );


    } catch (error) {

      console.error(
        "Fetch users error:",
        error
      );


      setError(
        error.response?.data?.message ||
        "Unable to fetch users"
      );

    } finally {

      setLoading(false);

    }
  };


  // =====================================================
  // LOAD USERS
  // =====================================================

  useEffect(() => {

    fetchUsers();

  }, []);


  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {

    return (
      <div className="admin-users-page">

        <div className="users-loading">
          Loading users...
        </div>

      </div>
    );
  }


  // =====================================================
  // ERROR
  // =====================================================

  if (error) {

    return (
      <div className="admin-users-page">

        <div className="users-header">

          <div>
            <h1>Users</h1>

            <p>
              Manage registered users
            </p>
          </div>

        </div>


        <div className="users-error">

          <h3>
            Unable to load users
          </h3>

          <p>
            {error}
          </p>

          <button
            onClick={fetchUsers}
          >
            Retry
          </button>

        </div>

      </div>
    );
  }


  // =====================================================
  // PAGE
  // =====================================================

  return (

    <div className="admin-users-page">


      {/* =================================================
          HEADER
      ================================================= */}

      <div className="users-header">

        <div>

          <h1>
            Users
          </h1>

          <p>
            Manage all registered users
          </p>

        </div>


        <div className="users-header-right">

          <div className="users-count">

            <span>
              Total Users
            </span>

            <strong>
              {users.length}
            </strong>

          </div>


          <button
            className="refresh-users-btn"
            onClick={fetchUsers}
          >
            ↻ Refresh
          </button>

        </div>

      </div>


      {/* =================================================
          USERS TABLE
      ================================================= */}

      <div className="users-card">

        <div className="users-table-wrapper">

          <table>

            <thead>

              <tr>

                <th>
                  ID
                </th>

                <th>
                  Username
                </th>

                <th>
                  Email
                </th>

                <th>
                  WhatsApp
                </th>

                <th>
                  Created At
                </th>

                

                <th>
                  Action
                </th>

              </tr>

            </thead>


            <tbody>

              {users.length === 0 ? (

                <tr>

                  <td
                    colSpan="7"
                    className="no-users"
                  >
                    No users found
                  </td>

                </tr>

              ) : (

                users.map((user) => (

                  <tr
                    key={user.id}
                  >

                    <td>

                      <span className="user-id">
                        #{user.id}
                      </span>

                    </td>


                    <td>

                      <div className="user-profile">

                        <div className="user-avatar">

                          {user.username
                            ?.charAt(0)
                            .toUpperCase()}

                        </div>


                        <strong>
                          {user.username}
                        </strong>

                      </div>

                    </td>


                    <td>
                      {user.email}
                    </td>


                    <td>
                      {user.whatsapp || "—"}
                    </td>


                    <td>
                      {user.created_at
                        ? new Date(
                            user.created_at
                          ).toLocaleString()
                        : "—"}
                    </td>


                    <td>
                      {user.updated_at
                        ? new Date(
                            user.updated_at
                          ).toLocaleString()
                        : "—"}
                    </td>


                    <td>

                      <button
                        className="view-user-btn"
                        onClick={() =>
                          console.log(
                            "User:",
                            user
                          )
                        }
                      >
                        View
                      </button>

                    </td>

                  </tr>

                ))

              )}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
}

export default AdminUsers;