
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/Signup.css";
import WhatsAppButton from "./WhatsappButton";

const Signup = () => {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();

    if (!username.trim() || !email.trim() || !whatsapp.trim() ||
        !password || !confirmPassword) {
      alert("Please fill in all fields.");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/auth/signup`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: username.trim(),
            email: email.trim(),
            whatsapp: whatsapp.trim(),
            password,
            confirmPassword,
          }),
        }
      );

      const data = await response.json();

      // console.log("Signup API response:", {
      //   success: data.success,
      //   message: data.message,
      //   hasToken: Boolean(data.token),
      //   user: data.user,
      // });

      if (!response.ok) {
        alert(data.message || "Signup failed.");
        return;
      }

      // Backend must return both the JWT token and user profile.
      if (!data.token || !data.user) {
        alert(
          "Account created successfully. Pls login with credentials"
        );
        return;
      }

      // Save authentication details.
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Redirect directly to the home page.
      navigate("/home", { replace: true });
    } catch (error) {
      console.error("Signup error:", error);
      alert("Unable to connect to server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-page">
      <form className="signup-card" onSubmit={handleSignup}>
        <div className="signup-input-group">
          <label>Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter username"
            required
          />
        </div>

        <div className="signup-input-group">
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter email"
            required
          />
        </div>

        <div className="signup-input-group">
          <label>WhatsApp</label>
          <input
            type="text"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="Enter WhatsApp number"
            required
          />
        </div>

        <div className="signup-input-group">
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            required
          />
        </div>

        <div className="signup-input-group">
          <label>Confirm password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm password"
            required
          />
        </div>

        <button
          type="submit"
          className="signup-btn"
          disabled={loading}
        >
          {loading ? "Creating Account..." : "Sign up"}
        </button>

        <div className="already-account">
          Already have an account?
          <Link to="/"> Sign in</Link>
        </div>
      </form>

      <WhatsAppButton />
    </div>
  );
};

export default Signup;
