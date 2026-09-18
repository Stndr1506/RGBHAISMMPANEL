import React from "react";
import { NavLink } from "react-router-dom";
import logo from "../assets/logo.png";
import "../styles/Home.css";

export default function AdminHome() {
  return (
    <div className="vertical-nav">
      <div className="vertical-navmenu">

        {/* Logo */}
        <div className="logo-container">
          <NavLink to="/admin">
            <img src={logo} alt="logo" />
          </NavLink>
        </div>

        {/* View as Member */}
        <li>
          <NavLink to="/">
            View as Member
          </NavLink>
        </li>

        {/* Admin Dashboard */}
        <li>
          <NavLink to="/admin">
            Dashboard
          </NavLink>
        </li>

        {/* Users */}
        <li>
          <NavLink to="/admin/users">
            Users
          </NavLink>
        </li>

        {/* Orders */}
        <li>
          <NavLink to="/admin/orders">
            Orders
          </NavLink>
        </li>

        {/* Services */}
        <li>
          <NavLink to="/admin/services">
            Services
          </NavLink>
        </li>

        {/* Payments */}
        <li>
          <NavLink to="/admin/payments">
            Payments
          </NavLink>
        </li>

        {/* Subscriptions */}
        <li>
          <NavLink to="/admin/subscriptions">
            Subscriptions
          </NavLink>
        </li>

        {/* API */}
        <li>
          <NavLink to="/admin/api">
            API
          </NavLink>
        </li>

        {/* Affiliates */}
        <li>
          <NavLink to="/admin/affiliates">
            Affiliates
          </NavLink>
        </li>

        {/* Child Panel */}
        <li>
          <NavLink to="/admin/child-panel">
            Child Panel
          </NavLink>
        </li>

        {/* Tickets */}
        <li>
          <NavLink to="/admin/tickets">
            Tickets
          </NavLink>
        </li>

        {/* Updates */}
        <li>
          <NavLink to="/admin/updates">
            Updates
          </NavLink>
        </li>

        {/* Logout */}
        <li>
          <NavLink to="/login">
            Logout
          </NavLink>
        </li>

      </div>
    </div>
  );
}
