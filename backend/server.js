// const dotenv = require("dotenv");

// dotenv.config();
require("dotenv").config();
const express = require("express");
const cors = require("cors");


const authRoutes = require("./routes/authRoutes");
const adminServiceRoutes = require('./routes/adminServiceRoutes');
const walletRoutes = require("./routes/walletRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const orderRoutes = require("./routes/orderRoutes");
const adminOrderRoutes = require("./routes/adminOrderRoutes");
const adminUserRoutes = require("./routes/adminUserRoutes");
const adminPaymentRoutes = require("./routes/adminPaymentRoutes");
const paytmRoutes = require("./routes/paytmRoutes");
const serviceRoutes = require("./routes/serviceRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");



const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  "http://localhost:3000",
  "https://rgbhaismmpanel-fhxp-roan.vercel.app",
];

// app.use(
//   cors({
//     origin: process.env.FRONTEND_URL,
//     credentials: true,
//   })
// );
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(express.json());

app.use(express.urlencoded({
  extended: true,
}));


app.get("/test", (req, res) => {
  res.send("Server route working");
});



app.use("/api/auth", authRoutes);
app.use('/api/admin-service', adminServiceRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminOrderRoutes);
app.use("/api/admin/users", adminUserRoutes);
app.use("/api/admin/payments", adminPaymentRoutes);
app.use("/api/payments/paytm", paytmRoutes);
app.use("/api/dashboard-service", serviceRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.listen(PORT, () => {
  console.log(
    `Server running on port ${PORT}`
  );
});

