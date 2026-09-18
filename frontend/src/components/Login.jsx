import React, { useState } from "react";

import '../styles/Login.css';



const Login = () => {

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState("");

  const handleLogin = async ()=>{
    if(!username || !password){
      alert("Please enter username or password")
    return;
    }
    try {
      setLoading(true);

      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Login failed");
        return;
      }

      // Save token returned by your Node.js backend
      localStorage.setItem("token", data.token);

      // Save logged-in user
      localStorage.setItem("user", JSON.stringify(data.user));

      // Redirect after successful login
      window.location.href = "/";

    } catch (error) {
      console.error(error);
      alert("Unable to connect to server");
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
          Cheapest <span>SMM</span> Panel API Provider: #1 Main{" "}
          <span>SMM</span> Service Provider
        </h1>

        <p>
          SMM Panel is an online store where people can buy likes, followers,
          views, YouTube views etc. providing you with unbeatable prices for
          all of your social marketing need.
        </p>
      </div>

      {/* Floating emojis */}
      

      {/* <div className="emoji-stars">
        ⭐ ⭐ ⭐ ⭐ ⭐
      </div> */}

      {/* <div className="emoji emoji-love-right">😍</div>

      <div className="heart-message">
        ❤️
      </div>
      <div className="emoji emoji-love-left">😍</div> */}

      {/* Login Card */}
      <div className="login-card">

        <div className="input-row">
          
          <div className="input-group">
            <label>Username</label>
          <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            />
          </div>

        </div>

        <div className="forgot-password">
          Forgot password?
        </div>

        <button className="signin-btn"
        onClick={handleLogin}>
          Sign in
        </button>

        <div className="signup-text">
          Do not have an account?
          <a href="/signup">Signup</a>
        </div>

      </div>

      {/* WhatsApp button */}
      <div className="whatsapp-btn">
        <span>☎</span>
      </div>

    </div>
  );
};

export default Login;