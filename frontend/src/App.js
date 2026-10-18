
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Home from "./pages/Home";
import Signup from "./components/Signup";
import Login from "./components/Login";
import NewOrder from "./dashboard/NewOrder";
// import Funds from "./dashboard/Funds";
import API from "./dashboard/Api";
import Affiliates from "./dashboard/Affiliates";
import ChildPanel from "./dashboard/ChildPanel";
import Tickets from "./dashboard/Tickets";
import Updates from "./dashboard/Updates";
import AdminHome from "./admin/AdminHome";
import AdminService from "./admin/AdminService";
// import Users from "./admin/Users";
import AdminOrders from "./admin/AdminOrders";
import Payments from "./admin/Payments";
import AdminUsers from "./admin/AdminUsers";
import AdminRoute from "./components/AdminRoute";
import Announcement from "./dashboard/Announcement";
import Services from "./pages/Services";
import AdminAnnouncement from "./admin/AdminAnnouncement";
import Orders from "./dashboard/Orders";
import DirectFunds from "./dashboard/DirectFunds";

// Protect user routes
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected user routes */}
        <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/new-order" element={<ProtectedRoute><NewOrder /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
        <Route path="/announcements" element={<ProtectedRoute><Announcement /></ProtectedRoute>} />
        <Route path="/dashboard-services" element={<ProtectedRoute><Services /></ProtectedRoute>} />
        <Route path="/add-funds" element={<ProtectedRoute><DirectFunds/></ProtectedRoute>} />
        <Route path="/api-integration" element={<ProtectedRoute><API /></ProtectedRoute>} />
        <Route path="/affiliates" element={<ProtectedRoute><Affiliates /></ProtectedRoute>} />
        <Route path="/child-panel" element={<ProtectedRoute><ChildPanel /></ProtectedRoute>} />
        <Route path="/tickets" element={<ProtectedRoute><Tickets /></ProtectedRoute>} />
        <Route path="/updates" element={<ProtectedRoute><Updates /></ProtectedRoute>} />
        <Route path="/api" element={<ProtectedRoute><h1>API</h1></ProtectedRoute>} />

        {/* Admin routes */}
        <Route path="/admin" element={<AdminRoute><AdminHome /></AdminRoute>} />
        <Route path="/admin/services" element={<AdminRoute><AdminService /></AdminRoute>} />
        <Route path="/admin/announcements" element={<AdminRoute><AdminAnnouncement /></AdminRoute>} />
        <Route path="/admin/orders" element={<AdminRoute><AdminOrders /></AdminRoute>} />
        <Route path="/admin/payments" element={<AdminRoute><Payments /></AdminRoute>} />
        <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
        {/* <Route path="/users" element={<AdminRoute><Users /></AdminRoute>} /> */}

        {/* Unknown routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
