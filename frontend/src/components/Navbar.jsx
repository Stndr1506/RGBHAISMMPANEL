
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  Package,
  Menu,
  X,
} from "lucide-react";

import logo from "../assets/logo.png";
import "../styles/Navbar.css";

const NAV_ITEMS = [
  {
    label: "New Order",
    path: "/new-order",
    icon: ShoppingCart,
  },
  {
    label: "Services",
    path: "/dashboard-services",
    icon: Layers,
  },
  {
    label: "Orders",
    path: "/orders",
    icon: Package,
  },
  {
    label: "Add Funds",
    path: "/add-funds",
    icon: Wallet,
  },
  {
    label: "API",
    path: "/api-integration",
    icon: Code2,
  },
  {
    label: "Affiliates",
    path: "/affiliates",
    icon: Users,
  },
  {
    label: "Announcements",
    path: "/announcements",
    icon: Megaphone,
  },
  {
    label: "Tickets",
    path: "/tickets",
    icon: Ticket,
  },
  {
    label: "Updates",
    path: "/updates",
    icon: BellRing,
  },
];

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const closeMenu = () => setMenuOpen(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    closeMenu();
    navigate("/", { replace: true });
  };

  return (
    <div className="rgbhai-navbar">
      {/* HEADER */}
      <header className="rgbhai-navbar-header">
        <Link
          to="/new-order"
          className="rgbhai-navbar-logo"
          onClick={closeMenu}
          aria-label="RGBHAI SMM Panel home"
        >
          <img src={logo} alt="RGBHAI SMM Panel" />
        </Link>

        <button
          type="button"
          className="rgbhai-navbar-toggle"
          onClick={() => setMenuOpen((previous) => !previous)}
          aria-label={menuOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={25} /> : <Menu size={25} />}
        </button>
      </header>

      {/* NAVIGATION */}
      <nav
        className={`rgbhai-navbar-nav ${
          menuOpen ? "rgbhai-navbar-open" : ""
        }`}
        aria-label="Main navigation"
      >
        <ul className="rgbhai-navbar-list">
          {NAV_ITEMS.map(({ label, path, icon: Icon }) => (
            <li key={path}>
              <Link
                to={path}
                className="rgbhai-navbar-link"
                onClick={closeMenu}
              >
                <Icon size={19} />
                <span>{label}</span>
              </Link>
            </li>
          ))}

          <li>
            <button
              type="button"
              className="rgbhai-navbar-link rgbhai-navbar-logout"
              onClick={handleLogout}
            >
              <LogOut size={19} />
              <span>Logout</span>
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
}

export default Navbar;
