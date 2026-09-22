import { BrowserRouter, Routes, Route } from "react-router-dom";
// import Navbar from "./components/Navbar";
import Home from './pages/Home';
import Signup from "./components/Signup";
import Login from './components/Login';
// import Services from "./pages/Services";
import NewOrder from "./dashboard/NewOrder";

import DashboardServices from "./dashboard/DashboardService";
import Funds from "./dashboard/Funds";
import API from "./dashboard/Api";
import Affiliates from "./dashboard/Affiliates";
import ChildPanel from "./dashboard/ChildPanel";
import Tickets from "./dashboard/Tickets";
import Updates from "./dashboard/Updates";
import AdminHome from "./admin/AdminHome";
import AdminService from "./admin/AdminService";
import Users from "./admin/Users";
import AdminOrders from "./admin/AdminOrders";
import Payments from "./admin/Payments";
import AdminUsers from "./admin/AdminUsers";
import AdminRoute from "./components/AdminRoute";



function App() {
  return (
    <BrowserRouter>
      
      <Routes>
        <Route path="/home" element={<Home/>} />
        <Route path="/" element={<Login/>} />
        {/* <Route path="/" element={<Services/>} /> */}
        <Route path="/api" element={<h1>API</h1>} />
        <Route path="/signup" element={<Signup/>} />
        <Route path="/new-order" element={<NewOrder/>}/>
        
        <Route path="/dashboard-services" element={<DashboardServices/>}/>
        <Route path="/add-funds" element={<Funds/>}/>
        <Route path="/api-integration" element={<API/>}/>
        <Route path="/affiliates" element={<Affiliates/>}/>
        <Route path="/child-panel" element={<ChildPanel/>}/>
        <Route path="/tickets" element={<Tickets/>}/>
        <Route path="/updates" element={<Updates/>}/>
        {/* <Route path="/admin" element={<AdminHome/>}/> */}
        <Route path="/admin/services" element={<AdminService/>}/>
        <Route path='/users' element={<Users/>}/>
        <Route path="/admin/orders" element={<AdminOrders/>}/>
        <Route path="/admin/payments" element={<Payments/>}/>
        <Route path="/admin/users" element={<AdminUsers/>}/>
        <Route path="/admin" element={<AdminRoute><AdminHome/></AdminRoute>}/>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
