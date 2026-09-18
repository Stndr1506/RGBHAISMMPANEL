import React from "react";
import {Link} from 'react-router-dom';
import logo from '../assets/logo.png';
import '../styles/Navbar.css';


export default function Navbar(){
    return(
        <div className="nav-container">
            <div className="nav-menu">
                <li><Link to='/' className="logo">
                <img src={logo} alt="SGBHAIMMM LOGO"/>
                <div className="logo-text">
                    <strong>RGBHAI</strong><br/>
                    <strong>SMM</strong>
                </div>
                </Link></li>
                {/* <li><Link to="/">Home</Link></li> */}
                <li><Link to="/login">Login</Link></li>
                <li><Link to="/services">Services</Link></li>
                <li><Link to="/api">API</Link></li>
                <li><Link to="/signup">Sign up</Link></li>
            </div>
            
        </div>
    )
}

