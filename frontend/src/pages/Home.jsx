
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import logo from "../assets/logo.png";
import "../styles/Home.css";

function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dashboard, setDashboard] = useState({
  username: "",
  balance: 0,
  totalOrders: 0,
});

const [, setLoading] = useState(true);

useEffect(() => {
  const fetchDashboard = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await axios.get(
        "http://localhost:5000/api/dashboard",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setDashboard(response.data.data);
      }
    } catch (error) {
      console.error(
        "Failed to fetch dashboard:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  fetchDashboard();
}, []);

  return (
    <div className="home-page">

      {/* ================= HEADER ================= */}
      <header className="top-header">

        <div className="logo-container">
          <Link to="/new-order">
            <img src={logo} alt="logo" />
          </Link>
        </div>

       
        <button
  className="hamburger-btn"
  onClick={() => setMenuOpen((prev) => !prev)}
  aria-label="Toggle navigation"
  aria-expanded={menuOpen}
>
  {menuOpen ? "✕" : "☰"}
</button>

      </header>

      {/* ================= NAVBAR ================= */}
      <nav className={`vertical-nav ${menuOpen ? "menu-open" : ""}`}>

        <div className="vertical-navmenu">

          <li>
            <Link to="/new-order" onClick={() => setMenuOpen(false)}>
              New Order
            </Link>
          </li>

          <li>
            <Link to="/dashboard-services" onClick={() => setMenuOpen(false)}>
              Services
            </Link>
          </li>

          <li>
            <Link to="/add-funds" onClick={() => setMenuOpen(false)}>
              Add Funds
            </Link>
          </li>

          <li>
            <Link to="/admin" onClick={() => setMenuOpen(false)}>
              View as Admin
            </Link>
          </li>

          <li>
            <Link to="/" onClick={() => setMenuOpen(false)}>
              Logout
            </Link>
          </li>

          <li>
            <Link to="/announcement" onClick={() => setMenuOpen(false)}>
              Announcement group
            </Link>
          </li>

          <li>
            <Link to="/api-integration" onClick={() => setMenuOpen(false)}>
              API
            </Link>
          </li>

          <li>
            <Link to="/affiliates" onClick={() => setMenuOpen(false)}>
              Affiliates
            </Link>
          </li>

          <li>
            <Link to="/child-panel" onClick={() => setMenuOpen(false)}>
              Child Panel
            </Link>
          </li>

          <li>
            <Link to="/tickets" onClick={() => setMenuOpen(false)}>
              Tickets
            </Link>
          </li>

          <li>
            <Link to="/" onClick={() => setMenuOpen(false)}>
              Mass Order
            </Link>
          </li>

          <li>
            <Link to="/updates" onClick={() => setMenuOpen(false)}>
              Updates
            </Link>
          </li>

        </div>
      </nav>


      {/* ================= DASHBOARD INFO ================= */}
      <main className="main-content">

        {/* User Details */}
        <section className="info-card">

          <div className="info-icon">
            👤
          </div>

          <div className="info-content">
            <h2>{dashboard.username}</h2>
            <p>Welcome to rgbhaismmpanel.com</p>
          </div>

        </section>


        {/* Panel Orders */}
        <section className="info-card">

          <div className="info-icon">
            ☷
          </div>

          <div className="info-content">
            <h2>{dashboard.totalOrders}</h2>
            <p>Panel orders</p>
          </div>

        </section>


        {/* Available Funds */}
        <section className="info-card">

          <div className="info-icon">
            📋
          </div>

          <div className="info-content">
            <h2>₹{Number(dashboard.balance).toFixed(2)}</h2>

            <p>
              To Add fund{" "}
              <Link to="/add-funds" className="fund-link">
                CLICK HERE
              </Link>
            </p>
          </div>

        </section>


        
      </main>

    </div>
  );
}

export default Home;