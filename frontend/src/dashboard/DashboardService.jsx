import React, { useEffect, useMemo, useState } from "react";
import "../styles/DashboardServices.css";
import Home from "../pages/Home";
import WhatsAppButton from "../components/WhatsappButton";

// Backend API
const API_URL = `${process.env.REACT_APP_API_URL}/api/dashboard-service`;

const categories = [
  "All",
  "Telegram Services",
  "Instagram Views",
  "Instagram Followers",
  "Instagram Followers India",
  "Instagram Likes",
  "Instagram Comments",
  "Instagram Channel",
  "YouTube Views",
  "YouTube Subscribers",
  "Facebook",
  "TikTok",
  "Website Traffic",
];

const currencySymbols = {
  INR: "₹",
  USD: "$",
  EUR: "€",
};

function formatNumber(number) {
  return new Intl.NumberFormat("en-IN").format(Number(number));
}

function DashboardServices() {
  // =========================
  // STATE
  // =========================

  const [services, setServices] = useState([]);

  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [currency, setCurrency] = useState("INR");

  const [selectedService, setSelectedService] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =========================
  // LOAD SERVICES
  // =========================

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error("Failed to load services");
      }

      const data = await response.json();

      /*
        If your backend returns:
        {
          success: true,
          services: [...]
        }

        use:
        setServices(data.services);

        If your backend returns:
        [...]
        then use:
        setServices(data);
      */

      setServices(
        Array.isArray(data)
          ? data
          : data.services || []
      );
    } catch (err) {
      console.error("Fetch services error:", err);

      setError(
        "Unable to load services. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // FILTER SERVICES
  // =========================

  const filteredServices = useMemo(() => {
    return services.filter((item) => {
      const categoryMatch =
        category === "All" ||
        item.category === category;

      const searchText = search
        .toLowerCase()
        .trim();

      const searchMatch =
        item.service
          ?.toLowerCase()
          .includes(searchText) ||
        item.category
          ?.toLowerCase()
          .includes(searchText) ||
        String(item.id).includes(searchText);

      return categoryMatch && searchMatch;
    });
  }, [services, category, search]);

  return (
    <div className="services-page">
      <Home />

      {/* =========================
          MAIN
      ========================= */}

      <main className="container">

        {/* =========================
            HEADING
        ========================= */}

        <div className="page-heading">
          <div>
            <h1>Services</h1>

            <p>
              Choose from our wide range of
              social media services.
            </p>
          </div>
        </div>

        {/* =========================
            ERROR
        ========================= */}

        {error && (
          <div className="error-message">
            {error}

            <button
              onClick={fetchServices}
              className="retry-btn"
            >
              Retry
            </button>
          </div>
        )}

        {/* =========================
            SEARCH
        ========================= */}

        <div className="search-box">
          <span className="search-icon">
            ⌕
          </span>

          <input
            type="text"
            placeholder="Search service..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />
        </div>

        {/* =========================
            CATEGORY
        ========================= */}

        <div className="category-wrapper">
          {categories.map((item) => (
            <button
              key={item}
              className={
                category === item
                  ? "category-btn selected"
                  : "category-btn"
              }
              onClick={() =>
                setCategory(item)
              }
            >
              {item}
            </button>
          ))}
        </div>

        {/* =========================
            TOOLBAR
        ========================= */}

        <div className="service-toolbar">

          <div className="service-count">
            Showing{" "}
            <strong>
              {filteredServices.length}
            </strong>{" "}
            services
          </div>

          <select
            value={currency}
            onChange={(e) =>
              setCurrency(e.target.value)
            }
            className="currency-select"
          >
            <option value="INR">
              INR ₹
            </option>

            <option value="USD">
              USD $
            </option>

            <option value="EUR">
              EUR €
            </option>
          </select>

        </div>

        {/* =========================
            LOADING
        ========================= */}

        {loading && (
          <div className="loading">
            Loading services...
          </div>
        )}

        {/* =========================
            DESKTOP TABLE
        ========================= */}

        {!loading && (
          <div className="table-container">

            <table className="services-table">

              <thead>
                <tr>
                  <th>ID</th>

                  <th>Service</th>

                  <th>Rate per 1000</th>

                  <th>Min order</th>

                  <th>Max order</th>

                  <th>Average time</th>

                  <th></th>
                </tr>
              </thead>

              <tbody>

                {filteredServices.map(
                  (item) => (
                    <tr key={item.id}>

                      {/* ID */}

                      <td className="service-id">
                        {item.id}
                      </td>

                      {/* SERVICE */}

                      <td>
                        <div className="service-name">
                          {item.service}
                        </div>

                        <span className="service-category">
                          {item.category}
                        </span>
                      </td>

                      {/* RATE */}

                      <td className="rate">
                        {
                          currencySymbols[
                            currency
                          ]
                        }

                        {Number(
                          item.rate
                        ).toFixed(2)}
                      </td>

                      {/* MIN */}

                      <td>
                        {formatNumber(
                          item.min_order
                        )}
                      </td>

                      {/* MAX */}

                      <td>
                        {formatNumber(
                          item.max_order
                        )}
                      </td>

                      {/* TIME */}

                      <td className="time">
                        {
                          item.average_time
                        }
                      </td>

                      {/* VIEW */}

                      <td>
                        <button
                          className="view-btn"
                          onClick={() =>
                            setSelectedService(
                              item
                            )
                          }
                        >
                          View
                        </button>
                      </td>

                    </tr>
                  )
                )}

              </tbody>

            </table>

            {/* =========================
                NO RESULTS
            ========================= */}

            {filteredServices.length ===
              0 && (
              <div className="no-results">

                <div className="no-results-icon">
                  🔍
                </div>

                <h3>
                  No services found
                </h3>

                <p>
                  Try searching for another
                  service or category.
                </p>

              </div>
            )}

          </div>
        )}

        {/* =========================
            MOBILE CARDS
        ========================= */}

        {!loading && (
          <div className="mobile-services">

            {filteredServices.map(
              (item) => (
                <div
                  className="service-card"
                  key={item.id}
                >

                  <div className="card-top">

                    <div>
                      <span className="card-id">
                        ID #{item.id}
                      </span>

                      <h3>
                        {item.service}
                      </h3>
                    </div>

                    <span className="card-category">
                      {item.category}
                    </span>

                  </div>

                  <div className="card-details">

                    <div>
                      <span>
                        Rate / 1000
                      </span>

                      <strong>
                        {
                          currencySymbols[
                            currency
                          ]
                        }

                        {Number(
                          item.rate
                        ).toFixed(2)}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Min Order
                      </span>

                      <strong>
                        {formatNumber(
                          item.min_order
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Max Order
                      </span>

                      <strong>
                        {formatNumber(
                          item.max_order
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Average Time
                      </span>

                      <strong>
                        {
                          item.average_time
                        }
                      </strong>
                    </div>

                  </div>

                  <button
                    className="mobile-view-btn"
                    onClick={() =>
                      setSelectedService(
                        item
                      )
                    }
                  >
                    View Service
                  </button>

                </div>
              )
            )}

          </div>
        )}

      </main>

      {/* =========================
          VIEW MODAL
      ========================= */}

      {selectedService && (
        <div
          className="modal-overlay"
          onClick={() =>
            setSelectedService(null)
          }
        >

          <div
            className="service-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <button
              className="close-modal"
              onClick={() =>
                setSelectedService(null)
              }
            >
              ×
            </button>

            <span className="modal-id">
              Service #
              {selectedService.id}
            </span>

            <h2>
              {selectedService.category}
            </h2>

            <p className="modal-service-name">
              {selectedService.service}
            </p>

            <div className="modal-details">

              <div>
                <span>
                  Rate / 1000
                </span>

                <strong>
                  {
                    currencySymbols[
                      currency
                    ]
                  }

                  {Number(
                    selectedService.rate
                  ).toFixed(2)}
                </strong>
              </div>

              <div>
                <span>
                  Minimum Order
                </span>

                <strong>
                  {formatNumber(
                    selectedService.min_order
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Maximum Order
                </span>

                <strong>
                  {formatNumber(
                    selectedService.max_order
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Average Time
                </span>

                <strong>
                  {
                    selectedService.average_time
                  }
                </strong>
              </div>

            </div>

            <button
              className="modal-close-btn"
              onClick={() =>
                setSelectedService(null)
              }
            >
              Close
            </button>

          </div>

        </div>
      )}
      <WhatsAppButton/>

    </div>
  );
}

export default DashboardServices;
