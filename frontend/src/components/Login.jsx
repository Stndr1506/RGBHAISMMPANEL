
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import WhatsAppButton from "./WhatsappButton";
import "../styles/Login.css";

const API_URL = (
  process.env.REACT_APP_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

const DEFAULT_HEADING =
  "RG Bhai Main Google Ads Youtube Views Provider: #1 Main SMM Service Provider";

const DEFAULT_DESCRIPTION =
  "SMM Panel is an online store where people can buy likes, followers, views, YouTube views etc. providing you with unbeatable prices for all of your social marketing need.";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Dynamic login page content
  const [loginHeading, setLoginHeading] = useState(DEFAULT_HEADING);
  const [loginDescription, setLoginDescription] = useState(
    DEFAULT_DESCRIPTION
  );

  const navigate = useNavigate();

  // ==================================
  // FETCH LOGIN PAGE CONTENT
  // ==================================

  useEffect(() => {
    const fetchLoginContent = async () => {
      try {
        const response = await fetch(
          `${API_URL}/api/admin-settings`
        );

        if (!response.ok) {
          throw new Error("Unable to fetch login page settings");
        }

        const data = await response.json();
        const settings = data.settings;

        if (settings) {
          setLoginHeading(
            settings.login_heading || DEFAULT_HEADING
          );

          setLoginDescription(
            settings.login_description || DEFAULT_DESCRIPTION
          );
        }
      } catch (error) {
        console.error("Login content fetch error:", error);
        // Keep default heading and description if API fails.
      }
    };

    fetchLoginContent();
  }, []);

  // ==================================
  // LOGIN FUNCTION
  // ==================================

  const handleLogin = async (e) => {
    e?.preventDefault();

    if (loading) return;

    if (!username.trim() || !password) {
      alert("Please enter username and password");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/api/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: username.trim(),
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Login failed");
        return;
      }

      // Save authentication token
      localStorage.setItem("token", data.token);

      // Save logged-in user
      localStorage.setItem("user", JSON.stringify(data.user));

      // Redirect based on role
      if (data.user.role === "admin") {
        navigate("/admin");
      } else if (data.user.role === "user") {
        navigate("/home");
      } else {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        alert("Invalid user role");
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("Unable to connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ==================================
  // UI
  // ==================================

  return (
    <div className="home-page">

      {/* Decorative background elements */}
      <div className="heart heart-1">♡</div>
      <div className="heart heart-2">♡</div>
      <div className="heart heart-3">♡</div>
      <div className="heart heart-4">♡</div>
      <div className="heart heart-5">♡</div>

      {/* Dynamic Heading */}
      <div className="hero-section">
        <h1>{loginHeading}</h1>

        <p>{loginDescription}</p>
      </div>

      {/* Login Card */}
      <div className="login-card">
        <form
          onSubmit={handleLogin}
          className="login-form"
        >
          <div className="input-row">

            <div className="input-group">
              <label htmlFor="login-username">
                Username
              </label>

              <input
                id="login-username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="input-group">
              <label htmlFor="login-password">
                Password
              </label>

              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>

          </div>

          <div className="forgot-password">
            Forgot password?
          </div>

          <button
            type="submit"
            className={`signin-btn ${
              loading ? "signin-btn-loading" : ""
            }`}
            disabled={loading}
            aria-busy={loading}
          >
            {loading && (
              <span
                className="login-spinner"
                aria-hidden="true"
              />
            )}

            <span>
              {loading ? "Signing in..." : "Sign in"}
            </span>
          </button>

          <div
            className="login-progress-message"
            aria-live="polite"
          >
            {loading
              ? "Please wait while we verify your account."
              : ""}
          </div>

          <div className="already-account">
            Create new account?
            <a href="/signup">Signup</a>
          </div>

        </form>
      </div>

      {/* WhatsApp button */}
      <WhatsAppButton />

    </div>
  );
};

export default Login;
