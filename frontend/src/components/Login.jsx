
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import WhatsAppButton from "./WhatsappButton";
import "../styles/Login.css";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

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
        `${process.env.REACT_APP_API_URL}/api/auth/login`,
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

  return (
    <div className="home-page">
      {/* Decorative background elements */}
      <div className="heart heart-1">♡</div>
      <div className="heart heart-2">♡</div>
      <div className="heart heart-3">♡</div>
      <div className="heart heart-4">♡</div>
      <div className="heart heart-5">♡</div>

      {/* Heading */}
      <div className="hero-section">
        <h1>
          RG Bhai <span>Main Google Ads Youtube Views</span> Provider: #1 Main{" "}
          <span>SMM</span> Service Provider
        </h1>

        <p>
          SMM Panel is an online store where people can buy likes, followers,
          views, YouTube views etc. providing you with unbeatable prices for
          all of your social marketing need.
        </p>
      </div>

      {/* Login Card */}
      <div className="login-card">
        <form
          onSubmit={handleLogin}
          className="login-form"
        >
          <div className="input-row">
            <div className="input-group">
              <label htmlFor="login-username">Username</label>
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
              <label htmlFor="login-password">Password</label>
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
            className={`signin-btn ${loading ? "signin-btn-loading" : ""}`}
            disabled={loading}
            aria-busy={loading}
          >
            {loading && <span className="login-spinner" aria-hidden="true" />}
            <span>{loading ? "Signing in..." : "Sign in"}</span>
          </button>

          <div className="login-progress-message" aria-live="polite">
            {loading ? "Please wait while we verify your account." : ""}
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
