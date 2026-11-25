
import React, { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  ShoppingCart,
  Layers,
  Wallet,
  Users,
  Megaphone,
  Ticket,
  BellRing,
  LogOut,
  Package,
  Menu,
  X,
  Settings,
} from "lucide-react";

import "../styles/Navbar.css";

const API_URL = (
  process.env.REACT_APP_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

const NAV_ITEMS = [
  {
    label: "Orders",
    path: "/admin/orders",
    icon: ShoppingCart,
  },
  {
    label: "API Orders",
    path: "/admin/api-orders",
    icon: ShoppingCart,
  },
  {
    label: "Services",
    path: "/admin/services",
    icon: Layers,
  },
  {
    label: "Users",
    path: "/admin/users",
    icon: Package,
  },
  {
    label: "Announcements",
    path: "/admin/announcements",
    icon: Megaphone,
  },
  {
    label: "Admin Settings",
    path: "/admin/admin-settings",
    icon: Settings,
  },
  {
    label: "Add Provider",
    path: "/admin/providers",
    icon: Settings,
  },
  {
    label: "Payments",
    path: "/admin/payments",
    icon: Wallet,
  },
  {
    label: "Affiliates",
    path: "/admin/affiliates",
    icon: Users,
  },
  
  {
    label: "Tickets",
    path: "/admin/tickets",
    icon: Ticket,
  },
  {
    label: "Updates",
    path: "/admin/updates",
    icon: BellRing,
  },
];

function AdminNavbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState("");

  const navigate = useNavigate();

  const closeMenu = () => setMenuOpen(false);

  // ==================================
  // FETCH DYNAMIC WEBSITE LOGO
  // ==================================

  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const response = await fetch(
          `${API_URL}/api/admin-settings`
        );

        const data = await response.json();

        if (data.success && data.settings?.logo_image_path) {
          const imagePath = data.settings.logo_image_path;

          const fullLogoUrl = imagePath.startsWith("http")
            ? imagePath
            : `${API_URL}${imagePath.startsWith("/") ? "" : "/"}${imagePath}`;

          setLogoUrl(fullLogoUrl);
        }
      } catch (error) {
        console.error("Admin Navbar logo loading error:", error);
      }
    };

    fetchLogo();
  }, []);

  // ==================================
  // LOGOUT
  // ==================================

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

        <NavLink
          to="/admin/orders"
          className="rgbhai-navbar-logo"
          onClick={closeMenu}
          aria-label="RGBHAI SMM Panel admin home"
        >
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="RGBHAI SMM Panel"
            />
          ) : (
            <span className="rgbhai-navbar-logo-text">
              RGBHAI
            </span>
          )}
        </NavLink>

        <button
          type="button"
          className="rgbhai-navbar-toggle"
          onClick={() =>
            setMenuOpen((previous) => !previous)
          }
          aria-label={
            menuOpen ? "Close navigation" : "Open navigation"
          }
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
        aria-label="Admin navigation"
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
            <Link
              to="/admin/settings"
              className="rgbhai-navbar-link"
              onClick={closeMenu}
            >
              <Layers size={19} />
              <span>Settings</span>
            </Link>
          </li>

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

export default AdminNavbar;
