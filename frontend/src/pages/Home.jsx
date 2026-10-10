import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import logo from "../assets/logo.png";
import "../styles/Home.css";
import WhatsAppButton from "../components/WhatsappButton";
import {
  ShoppingCart,
  Layers,
  Wallet,
  Code2,
  Users,
  Megaphone,
  Ticket,
  BellRing,
  LogOut,
  ClipboardList,
  Package
} from "lucide-react";
import NewOrder from "../dashboard/NewOrder";

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
        // const token = localStorage.getItem("token");

        const response = await axios.get(
          "http://localhost:5000/api/dashboard"
          // {
          //   headers: {
          //     Authorization: `Bearer ${token}`,
          //   },
          // }
        );

        if (response.data.success) {
          setDashboard(response.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);
  

  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <div className="home-page">

      {/* ================= HEADER ================= */}

      <header className="top-header">

        {/* LOGO */}

        <div className="logo-container">
          <Link to="/new-order" onClick={closeMenu}>
            <img src={logo} alt="RGBHAI SMM Panel" />
          </Link>
        </div>


        {/* HAMBURGER */}

        <button
          type="button"
          className={`hamburger-btn ${
            menuOpen ? "active" : ""
          }`}
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
        >
          {menuOpen ? "✕" : "☰"}
        </button>

      </header>


      {/* ================= NAVIGATION ================= */}

      <nav
        className={`vertical-nav ${
          menuOpen ? "menu-open" : ""
        }`}
      >

        <ul className="vertical-navmenu">

          <li>
            <Link
              to="/new-order"
              onClick={closeMenu}
            >
              <ShoppingCart size={19}/>
              New Order
            </Link>
          </li>


          <li>
            <Link
              to="/dashboard-services"
              onClick={closeMenu}
            >
              <Layers size={19}/>
              Services
            </Link>
          </li>

          <li>
            <Link
              to="/orders"
              onClick={closeMenu}
            >
              <Package size={19}/>
              Orders
            </Link>
          </li>


          <li>
            <Link
              to="/add-funds"
              onClick={closeMenu}
            >
              <Wallet size={19}/>
              Add Funds
            </Link>
          </li>


          <li>
            <Link
              to="/api-integration"
              onClick={closeMenu}
            >
              <Code2 size={19}/>
              API
            </Link>
          </li>


          <li>
            <Link
              to="/affiliates"
              onClick={closeMenu}
            >
              <Users size={19}/>
              Affiliates
            </Link>
          </li>

          <li>
            <Link
              to="/announcements"
              onClick={closeMenu}
            >
              <Megaphone size={19}/>
              Announcements
            </Link>
          </li>

          {/* <li>
            <a
              href="https://chat.whatsapp.com/YOUR_GROUP_CODE"
              target="_blank"
              rel="noopener noreferrer"
              onClick={closeMenu}
            >
              📢 Announcements
            </a>
          </li> */}


          <li>
            <Link
              to="/tickets"
              onClick={closeMenu}
            >
              <Ticket size={19}/>
              Tickets
            </Link>
          </li>


          <li>
            <Link
              to="/updates"
              onClick={closeMenu}
            >
              <BellRing size={19}/>
              Updates
            </Link>
          </li>


          <li>
            <Link
              to="/"
              onClick={() => {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      closeMenu();
    }}
            >
              <LogOut size={19}/>
              Logout
            </Link>
          </li>

        </ul>

      </nav>


      {/* ================= MAIN CONTENT ================= */}

      <main className="main-content">


        {/* ================= USER DETAILS ================= */}

        <section className="info-card">

          <div className="info-icon">
            <Users size={24}/>
          </div>

          <div className="info-content">

            <h2>
              {dashboard.username}
            </h2>

            <p>
              Welcome to rgbhaismmpanel.com
            </p>

          </div>

        </section>


        {/* ================= PANEL ORDERS ================= */}

        <section className="info-card">

          <div className="info-icon">
            
            <ClipboardList size={24}/>
          </div>

          <div className="info-content">

            <h2>
              {dashboard.totalOrders}
            </h2>

            <p>
              Panel orders
            </p>

          </div>

        </section>


        {/* ================= AVAILABLE FUNDS ================= */}

        <section className="info-card">

          <div className="info-icon">
            <Wallet size={24}/>
          </div>

          <div className="info-content">

            <h2>
              ₹{Number(dashboard.balance).toFixed(2)}
            </h2>

            <p>
              To Add fund{" "}
              <Link
                to="/add-funds"
                className="fund-link"
              >
                CLICK HERE
              </Link>
            </p>

          </div>

        </section>


        {/* ================= WHATSAPP ================= */}

        <WhatsAppButton />

      </main>
      <NewOrder/>

    </div>
  );
}

export default Home;