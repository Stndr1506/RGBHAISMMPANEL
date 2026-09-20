import React from "react";
import { Link } from "react-router-dom";
import logo from '../assets/logo.png'
import '../styles/Home.css';


function Home() {
  return (
    <div className="vertical-nav">
      <div className="vertical-navmenu">
        <div className="logo-container">
          <li><Link to='/new-order'><img src={logo} alt="logo"/></Link></li>
        </div>
      <li><Link to='/new-order'>New Order</Link></li>
      <li><Link to='/dashboard-services'>Services</Link></li>
      <li><Link to='/add-funds'>Add Funds</Link></li>
      <li><Link to='/admin'>View as Admin</Link></li>
      <li><Link to='/'>Logout</Link></li>
      <li><Link to='/announcement'>Announcement group</Link></li>
      <li><Link to='/api-integration'>API</Link></li>
      <li><Link to='/affiliates'>Affiliates</Link></li>
      <li><Link to='/child-panel'>Child Panel</Link></li>
      <li><Link to='/tickets'>Tickets</Link></li>
      <li><Link to='/'>Mass Order</Link></li>
      <li><Link to='/updates'>Updates</Link></li>
      </div>
    </div>
      );
}


export default Home;
