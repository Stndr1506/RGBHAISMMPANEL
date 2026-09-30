import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/Services.css";
import Home from "./Home";
import {
  faInstagram,
  faYoutube,
  faTelegram,
  faTwitter,
  faFacebook,
  faTiktok,
  faSnapchat,
  faLinkedin,
} from "@fortawesome/free-brands-svg-icons";

const Services = () => {

  // ================================
  // STATE
  // ================================

  const [servicesData, setServicesData] = useState([]);
  const [search, setSearch] = useState("");
  const [currency, setCurrency] = useState("INR ₹");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  // ================================
  // FETCH SERVICES FROM BACKEND
  // ================================

  useEffect(() => {

    const fetchServices = async () => {

      try {

        setLoading(true);
        setError("");

        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/dashboard-service`
          // 'http://localhost:5000/api/dashboard-service'
        );

        console.log("Services API response:", response.data);

        if (response.data.success) {

          setServicesData(response.data.services || []);

        } else {

          setError("Failed to load services.");

        }

      } catch (error) {

        console.error(
          "Error fetching services:",
          error
        );

        setError(
          "Unable to load services. Please try again."
        );

      } finally {

        setLoading(false);

      }

    };

    fetchServices();

  }, []);


  // ================================
  // GET UNIQUE CATEGORIES
  // ================================

  const categories = [
    "All",
    ...new Set(
      servicesData.map(
        (item) => item.category
      )
    ),
  ];


  // ================================
  // SEARCH + CATEGORY FILTER
  // ================================

  const filteredServices = servicesData.filter(
    (service) => {

      const searchText =
        search.toLowerCase().trim();


      const serviceName =
        (service.service || "").toLowerCase();

      const category =
        (service.category || "").toLowerCase();


      const matchesSearch =
        serviceName.includes(searchText) ||
        category.includes(searchText) ||
        service.id
          ?.toString()
          .includes(searchText);


      const matchesCategory =
        selectedCategory === "All" ||
        service.category === selectedCategory;


      return (
        matchesSearch &&
        matchesCategory
      );

    }
  );


  // ================================
  // FORMAT NUMBERS
  // ================================

  const formatNumber = (number) => {

    if (
      number === null ||
      number === undefined
    ) {
      return "0";
    }

    return Number(number).toLocaleString("en-IN");

  };


  // ================================
  // RATE DISPLAY
  // ================================

  const getRate = (rate) => {

    const numericRate = Number(rate || 0);


    if (currency === "INR ₹") {

      return `₹${numericRate.toFixed(2)}`;

    }


    if (currency === "USD $") {

      return `$${numericRate.toFixed(4)}`;

    }


    if (currency === "EUR €") {

      return `€${numericRate.toFixed(4)}`;

    }


    return numericRate.toFixed(2);

  };


  // ================================
  // VIEW DESCRIPTION
  // ================================

  const handleView = (service) => {

    alert(
      
      `Service Name: ${service.service}\n` +
      `Service ID: ${service.id}\n` +
      `Service Rate: ${service.rate}\n`+
      `Service Time: ${service.average_time}\n`+
      `Description: ${
        service.description ||
        "No description available."
      }`
    );

  };

  // CATEGORY SOCIAL ICON
  // =====================================
  
  const getCategoryIcon = (category) => {
    const name = (category || "").toLowerCase();
  
    if (name.includes("instagram")) {
      return faInstagram;
    }
  
    if (
      name.includes("youtube") ||
      name.includes("you tube")
    ) {
      return faYoutube;
    }
  
    if (name.includes("telegram")) {
      return faTelegram;
    }
  
    if (
      name.includes("twitter") ||
      name.includes("x")
    ) {
      return faTwitter;
    }
  
    if (name.includes("facebook")) {
      return faFacebook;
    }
  
    if (name.includes("tiktok")) {
      return faTiktok;
    }
  
    if (name.includes("snapchat")) {
      return faSnapchat;
    }
  
    if (name.includes("linkedin")) {
      return faLinkedin;
    }
  
    return null;
  };

  // ================================
  // UI
  // ================================

  return (

    <div className="services-page">

      {/* HOME / NAVBAR */}

      <Home />


      {/* =================================
          SEARCH / FILTER AREA
      ================================= */}

      <div className="services-filter-card">


        {/* CATEGORY */}

        <select
          className="filter-select"
          value={selectedCategory}
          onChange={(e) =>
            setSelectedCategory(
              e.target.value
            )
          }
        >

          {categories.map(
            (category) => (

              <option
                key={category}
                value={category}
              >
                {category}
              </option>

            )
          )}

        </select>


        {/* CURRENCY */}

        <select
          className="currency-select"
          value={currency}
          onChange={(e) =>
            setCurrency(
              e.target.value
            )
          }
        >

          <option value="INR ₹">
            INR ₹
          </option>

          <option value="USD $">
            USD $
          </option>

          <option value="EUR €">
            EUR €
          </option>

        </select>


        {/* SEARCH */}

        <div className="search-box">

          <input
            type="text"
            placeholder="Search"
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
          />

          <button
            className="search-btn"
            type="button"
          >
            🔍
          </button>

        </div>

      </div>


      {/* =================================
          SERVICES TABLE
      ================================= */}

      <div className="services-table-card">


        {/* TABLE HEADER */}

        <div className="table-header">

          <div>ID</div>

          <div className="header-service">Service</div>

          <div>Rate per 1000</div>

          <div>Min order</div>

          <div>Max order</div>

          <div>Average time ⓘ</div>

          <div>Description</div>

        </div>


        {/* =================================
            LOADING
        ================================= */}

        {loading && (

          <div className="no-services">

            Loading services...

          </div>

        )}


        {/* =================================
            ERROR
        ================================= */}

        {!loading && error && (

          <div className="no-services">

            {error}

          </div>

        )}


        {/* =================================
            SERVICES
        ================================= */}

        {!loading &&
          !error &&
          filteredServices.length > 0 &&

          filteredServices.map(
            (service, index) => {

              const previousCategory =
                index > 0
                  ? filteredServices[
                      index - 1
                    ].category
                  : null;


              const showCategory =
                index === 0 ||
                previousCategory !==
                  service.category;


              return (

                <React.Fragment
                  key={service.id}
                >


                  {/* ==========================
                      CATEGORY ROW
                  ========================== */}

                  {showCategory && (

                    <div className="category-row">

                      <span className="category-icon">

                        {service.icon || "⭐"}

                      </span>


                      <span>

                        {service.category}

                      </span>

                    </div>

                  )}


                  {/* ==========================
                      SERVICE ROW
                  ========================== */}

                  <div className="service-row">


                    {/* ID */}

                    <div className="service-id">

                      {service.id}

                    </div>


                    {/* SERVICE NAME */}

                    <div className="service-name">

                      {service.service}

                    </div>


                    {/* RATE */}

                    <div className="service-rate">

                      {getRate(
                        service.rate
                      )}

                    </div>


                    {/* MIN ORDER */}

                    <div>

                      {formatNumber(
                        service.min_order
                      )}

                    </div>


                    {/* MAX ORDER */}

                    <div>

                      {formatNumber(
                        service.max_order
                      )}

                    </div>


                    {/* AVERAGE TIME */}

                    <div>

                      {service.average_time ||
                        "Not available"}

                    </div>


                    {/* DESCRIPTION */}

                    <div className="view-column">

                      <button
                        type="button"
                        className="view-btn"
                        onClick={() =>
                          handleView(
                            service
                          )
                        }
                      >
                        View
                      </button>

                    </div>

                  </div>

                </React.Fragment>

              );

            }

          )}


        {/* =================================
            NO SERVICES
        ================================= */}

        {!loading &&
          !error &&
          filteredServices.length === 0 && (

            <div className="no-services">

              No services found.

            </div>

          )}

      </div>

    </div>

  );

};

export default Services;