import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "../styles/NewOrder.css";
// import Home from "../pages/Home";

function NewOrder() {
  const [services, setServices] = useState([]);

  const [category, setCategory] = useState("All Categories");
  const [serviceId, setServiceId] = useState("");
  const [link, setLink] = useState("");
  const [quantity, setQuantity] = useState("");

  const [walletBalance, setWalletBalance] = useState(0);

  const [servicesLoading, setServicesLoading] = useState(true);
  const [walletLoading, setWalletLoading] = useState(true);
  const [orderLoading, setOrderLoading] = useState(false);

  /*
  ==========================================
  FETCH SERVICES
  ==========================================
  */

  const fetchServices = async () => {
    try {
      setServicesLoading(true);

      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/dashboard-service`
      );

      console.log("Services:", response.data);

      setServices(response.data);

    } catch (error) {
      console.error(
        "Error fetching services:",
        error
      );

      alert("Unable to load services.");

    } finally {
      setServicesLoading(false);
    }
  };


  /*
  ==========================================
  FETCH WALLET
  ==========================================
  */
const fetchWalletBalance = async () => {
  try {
    setWalletLoading(true);

    const token = localStorage.getItem("token");

    console.log("Token exists:", !!token);

    const response = await axios.get(
      `${process.env.REACT_APP_API_URL}/api/wallet/balance`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log("Wallet response:", response.data);

    setWalletBalance(
      Number(response.data.balance) || 0
    );

  } catch (error) {
    console.error("Wallet error:", error);
    console.log("Status:", error.response?.status);
    console.log("Response:", error.response?.data);

    setWalletBalance(0);

  } finally {
    setWalletLoading(false);
  }
};
  /*
  ==========================================
  LOAD PAGE DATA
  ==========================================
  */

  useEffect(() => {

    fetchServices();
    fetchWalletBalance();

  }, []);


  /*
  ==========================================
  CREATE CATEGORIES FROM SERVICES
  ==========================================
  */

  const categories = useMemo(() => {

    const uniqueCategories = [
      ...new Set(
        services.map(
          (service) => service.category
        )
      ),
    ];

    return [
      "All Categories",
      ...uniqueCategories,
    ];

  }, [services]);


  /*
  ==========================================
  FILTER SERVICES
  ==========================================
  */

  const filteredServices = useMemo(() => {

    if (category === "All Categories") {
      return services;
    }

    return services.filter(
      (service) =>
        service.category === category
    );

  }, [category, services]);


  /*
  ==========================================
  SELECTED SERVICE
  ==========================================
  */

  const selectedService = services.find(
    (service) =>
      String(service.id) ===
      String(serviceId)
  );


  /*
  ==========================================
  TOTAL PRICE
  ==========================================
  */

  const totalPrice = selectedService
    ? ((Number(quantity) || 0)) *
      Number(selectedService.rate)
    : 0;


  /*
  ==========================================
  BALANCE CHECK
  ==========================================
  */

  const insufficientBalance =
    totalPrice > walletBalance;


  /*
  ==========================================
  CATEGORY CHANGE
  ==========================================
  */

  const handleCategoryChange = (value) => {

    setCategory(value);

    setServiceId("");

    setQuantity("");

  };


  /*
  ==========================================
  SERVICE CHANGE
  ==========================================
  */

  const handleServiceChange = (value) => {

    setServiceId(value);

    const service = services.find(
      (item) =>
        String(item.id) ===
        String(value)
    );

    if (service) {

      setQuantity(service.min);

    } else {

      setQuantity("");

    }
  };


  /*
  ==========================================
  PLACE ORDER
  ==========================================
  */

  const handleSubmit = async (e) => {

    e.preventDefault();


    if (!selectedService) {

      alert(
        "Please select a service."
      );

      return;
    }


    if (!link.trim()) {

      alert(
        "Please enter a link."
      );

      return;
    }


    const orderQuantity =
      Number(quantity);


    if (!orderQuantity) {

      alert(
        "Please enter quantity."
      );

      return;
    }


    if (
      orderQuantity <
        Number(selectedService.min) ||
      orderQuantity >
        Number(selectedService.max)
    ) {

      alert(
        `Quantity must be between ${selectedService.min.toLocaleString()} and ${selectedService.max.toLocaleString()}.`
      );

      return;
    }


    /*
    ========================================
    CHECK WALLET
    ========================================
    */

    if (
      totalPrice >
      walletBalance
    ) {

      alert(
        `Insufficient wallet balance.

Order Amount: ₹${totalPrice.toFixed(2)}

Wallet Balance: ₹${walletBalance.toFixed(2)}

Please add funds.`
      );

      return;
    }


    try {

      setOrderLoading(true);

       const token = localStorage.getItem("token");

  console.log("ORDER TOKEN:", token);

  if (!token) {
    alert("Session expired. Please login again.");
    return;
  }

      /*
      ======================================
      SEND ORDER TO BACKEND
      ======================================
      */

      const response =
        await axios.post(
          `${process.env.REACT_APP_API_URL}/api/orders`,
          {

            serviceId:
              selectedService.id,

            serviceName:
              selectedService.name,

            category:
              selectedService.category,

            link:
              link.trim(),

            quantity:
              orderQuantity,

            rate:
              Number(
                selectedService.rate
              ),

            amount:
              totalPrice,

          },
          {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
          
        );


      alert(
        response.data.message ||
          "Order placed successfully!"
      );


      /*
      ======================================
      RESET FORM
      ======================================
      */

      setServiceId("");

      setLink("");

      setQuantity("");


      /*
      ======================================
      REFRESH WALLET
      ======================================
      */

      await fetchWalletBalance();


    } catch (error) {

      console.error(
        "Order error:",
        error
      );

      alert(
        error.response?.data?.message ||
          "Unable to place order."
      );

    } finally {

      setOrderLoading(false);

    }
  };


  return (

    <div className="order-page">

      {/* <Home /> */}

      <main className="order-container">

        <div className="order-title">

          <h1>
            New Order
          </h1>

          <p>
            Select a service and place a new
            order.
          </p>

        </div>


        <div className="order-layout">


          {/* =================================
              ORDER FORM
          ================================= */}

          <div className="order-form-card">

            <div className="card-heading">

              <div className="heading-icon">
                +
              </div>

              <div>

                <h2>
                  Create New Order
                </h2>

                <p>
                  Fill in the details below
                </p>

              </div>

            </div>


            <form onSubmit={handleSubmit}>


              {/* CATEGORY */}

              <div className="form-group">

                <label>
                  Category
                </label>

                <select
                  value={category}
                  onChange={(e) =>
                    handleCategoryChange(
                      e.target.value
                    )
                  }
                  disabled={servicesLoading}
                >

                  {categories.map(
                    (item) => (

                      <option
                        key={item}
                        value={item}
                      >
                        {item}
                      </option>

                    )
                  )}

                </select>

              </div>


              {/* SERVICE */}

              <div className="form-group">

                <label>
                  Service
                </label>

                <select
                  value={serviceId}
                  onChange={(e) =>
                    handleServiceChange(
                      e.target.value
                    )
                  }
                  disabled={
                    servicesLoading
                  }
                >

                  <option value="">

                    {servicesLoading
                      ? "Loading services..."
                      : "Select a service"}

                  </option>


                  {filteredServices.map(
                    (service) => (

                      <option
                        key={service.id}
                        value={service.id}
                      >

                        {service.id} -{" "}
                        {service.service}

                      </option>

                    )
                  )}

                </select>

              </div>


              {/* SERVICE INFO */}

              {selectedService && (

                <div className="service-info">

                  <div className="service-info-header">

                    <span>
                      Service #
                      {selectedService.id}
                    </span>

                    <span className="service-badge">

                      {
                        selectedService.category
                      }

                    </span>

                  </div>


                  <h3>
                    {selectedService.name}
                  </h3>


                  <p>
                    {
                      selectedService.description
                    }
                  </p>


                  <div className="service-limits">

                    <div>

                      <span>
                        Rate
                      </span>

                      <strong>
                        ₹
                        {Number(
                          selectedService.rate
                        ).toFixed(2)}
                      </strong>

                    </div>


                    <div>

                      <span>
                        Min
                      </span>

                      <strong>
                        {Number(
                          selectedService.min
                        ).toLocaleString()}
                      </strong>

                    </div>


                    <div>

                      <span>
                        Max
                      </span>

                      <strong>
                        {Number(
                          selectedService.max
                        ).toLocaleString()}
                      </strong>

                    </div>

                  </div>

                </div>

              )}


              {/* LINK */}

              <div className="form-group">

                <label>
                  Link
                </label>

                <input
                  type="text"
                  value={link}
                  onChange={(e) =>
                    setLink(e.target.value)
                  }
                  placeholder="Enter post, profile or video link"
                />

              </div>


              {/* QUANTITY */}

              <div className="form-group">

                <label>
                  Quantity
                </label>

                <input
                  type="number"
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(
                      e.target.value
                    )
                  }
                  min={
                    selectedService?.min
                  }
                  max={
                    selectedService?.max
                  }
                  placeholder={
                    selectedService
                      ? `${selectedService.min} - ${selectedService.max}`
                      : "Enter quantity"
                  }
                />

              </div>


              {/* INSUFFICIENT BALANCE */}

              {selectedService &&
                quantity &&
                insufficientBalance && (

                  <div className="wallet-warning">

                    <strong>
                      Insufficient Wallet
                      Balance
                    </strong>

                    <p>
                      Order Amount: ₹
                      {totalPrice.toFixed(2)}
                    </p>

                    <p>
                      Available Balance: ₹
                      {walletBalance.toFixed(2)}
                    </p>

                    <a href="/add-funds">
                      Add Funds →
                    </a>

                  </div>

                )}


              {/* DRIP FEED */}

              <div className="checkbox-row">

                <input
                  type="checkbox"
                  id="drip"
                />

                <label htmlFor="drip">
                  Enable Drip-feed
                </label>

              </div>


              {/* PLACE ORDER */}

              <button
                type="submit"
                className="place-order-btn"
                disabled={
                  orderLoading ||
                  walletLoading ||
                  servicesLoading ||
                  !selectedService ||
                  insufficientBalance
                }
              >

                {orderLoading
                  ? "Placing Order..."
                  : insufficientBalance
                  ? "Insufficient Balance"
                  : "Place Order"}

              </button>

            </form>

          </div>


          {/* =================================
              SUMMARY
          ================================= */}

          <aside className="order-summary">

            <div className="summary-card">

              <div className="summary-title">

                <h2>
                  Order Summary
                </h2>

                <span>
                  ₹
                </span>

              </div>


              <div className="summary-line">

                <span>
                  Service
                </span>

                <strong>
                  {selectedService
                    ? `#${selectedService.id}`
                    : "—"}
                </strong>

              </div>


              <div className="summary-line">

                <span>
                  Category
                </span>

                <strong>
                  {selectedService
                    ? selectedService.category
                    : "—"}
                </strong>

              </div>


              <div className="summary-line">

                <span>
                  Quantity
                </span>

                <strong>

                  {quantity
                    ? Number(
                        quantity
                      ).toLocaleString()
                    : "—"}

                </strong>

              </div>


              <div className="summary-line">

                <span>
                  Rate
                </span>

                <strong>

                  {selectedService
                    ? `₹${Number(
                        selectedService.rate
                      ).toFixed(2)}`
                    : "—"}

                </strong>

              </div>


              <div className="summary-divider" />


              <div className="total-row">

                <span>
                  Total
                </span>

                <strong>
                  ₹
                  {totalPrice.toFixed(2)}
                </strong>

              </div>


              {/* WALLET */}

              <div className="summary-line">

                <span>
                  Wallet Balance
                </span>

                <strong>

                  {walletLoading
                    ? "Loading..."
                    : `₹${walletBalance.toFixed(
                        2
                      )}`}

                </strong>

              </div>


              {/* REMAINING */}

              {selectedService &&
                quantity &&
                !insufficientBalance && (

                  <div className="remaining-balance">

                    Remaining Balance:{" "}

                    <strong>
                      ₹
                      {(
                        walletBalance -
                        totalPrice
                      ).toFixed(2)}
                    </strong>

                  </div>

                )}


              <button
                type="button"
                className="summary-order-btn"
                onClick={handleSubmit}
                disabled={
                  orderLoading ||
                  walletLoading ||
                  servicesLoading ||
                  !selectedService ||
                  insufficientBalance
                }
              >

                {orderLoading
                  ? "Processing..."
                  : insufficientBalance
                  ? "Insufficient Balance"
                  : "Confirm Order"}

              </button>

            </div>


            {/* WALLET CARD */}

            <div className="balance-card">

              <div className="balance-icon">
                ₹
              </div>

              <div>

                <span>
                  Available Balance
                </span>

                <strong>

                  {walletLoading
                    ? "Loading..."
                    : `₹${(walletBalance).toFixed(
                        2
                      )}`}

                </strong>

              </div>

            </div>


            {/* HELP */}

            <div className="help-card">

              <h3>
                Need help?
              </h3>

              <p>
                Make sure your link is public and
                the quantity is within the allowed
                limits.
              </p>

              <a href="/support">
                Contact Support →
              </a>

            </div>

          </aside>

        </div>

      </main>

    </div>

  );
}

export default NewOrder;