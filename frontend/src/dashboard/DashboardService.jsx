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
  const [services, setServices] = useState([]);
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [currency, ] = useState("INR");
  const [selectedService, setSelectedService] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

      setServices(
        Array.isArray(data)
          ? data
          : data.services || []
      );
    } catch (err) {
      console.error("Fetch services error:", err);
      setError("Unable to load services. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const filteredServices = useMemo(() => {
    const searchText = search.toLowerCase().trim();

    return services.filter((item) => {
      const categoryMatch =
        category === "All" || item.category === category;

      const searchMatch =
        !searchText ||
        item.service?.toLowerCase().includes(searchText) ||
        item.category?.toLowerCase().includes(searchText) ||
        String(item.id).includes(searchText);

      return categoryMatch && searchMatch;
    });
  }, [services, category, search]);

  // Group filtered services by category so the page looks like the screenshot.
  const groupedServices = useMemo(() => {
    return filteredServices.reduce((groups, item) => {
      const groupName = item.category || "Other Services";

      if (!groups[groupName]) {
        groups[groupName] = [];
      }

      groups[groupName].push(item);
      return groups;
    }, {});
  }, [filteredServices]);

  const toggleFavorite = (id) => {
    setFavorites((current) =>
      current.includes(id)
        ? current.filter((itemId) => itemId !== id)
        : [...current, id]
    );
  };

  return (
    <div className="services-page">
      <Home />

      <main className="services-main">

        {/* Search / Filter card */}
        <section className="services-filter-card">

          <div className="category-select-wrap">
            <span className="filter-icon">▽</span>

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="category-select"
            >
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <span className="select-arrow">⌄</span>
          </div>

          <div className="services-search">
            <input
              type="text"
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <button
              type="button"
              aria-label="Search"
              onClick={() => setSearch(search.trim())}
            >
              🔍
            </button>
          </div>

        </section>

        {error && (
          <div className="error-message">
            <span>{error}</span>
            <button onClick={fetchServices} className="retry-btn">
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="services-loading-card">
            Loading services...
          </div>
        ) : (
          <section className="services-list-card">

            {/* Table heading */}
            <div className="services-table-header">
              <div className="header-id">ID</div>
              <div className="header-service">Service</div>
              <div className="header-rate">Rate per 1000</div>
              <div className="header-min">Min order</div>
              <div className="header-min">Max order</div>
              <div className="header-min">Average time</div>
              <div className="header-min">Description</div>
            </div>

            {Object.keys(groupedServices).length === 0 ? (
              <div className="no-results">
                <div className="no-results-icon">🔍</div>
                <h3>No services found</h3>
                <p>Try searching for another service or category.</p>
              </div>
            ) : (
              Object.entries(groupedServices).map(
                ([groupName, groupServices]) => (
                  <div className="service-group" key={groupName}>

                    {/* Category heading */}
                    <div className="service-category-heading">
                      <span className="category-platform-icon">
                        {groupName.toLowerCase().includes("instagram")
                          ? "◎"
                          : groupName.toLowerCase().includes("telegram")
                          ? "✦"
                          : groupName.toLowerCase().includes("youtube")
                          ? "▶"
                          : groupName.toLowerCase().includes("facebook")
                          ? "f"
                          : groupName.toLowerCase().includes("tiktok")
                          ? "♪"
                          : "✦"}
                      </span>

                      <h2>{groupName}</h2>
                    </div>

                    {/* Service rows */}
                    {groupServices.map((item) => (
                      <div className="service-row" key={item.id}>

                        <div className="service-favorite">
                          <button
                            type="button"
                            className={
                              favorites.includes(item.id)
                                ? "favorite-btn active"
                                : "favorite-btn"
                            }
                            onClick={() => toggleFavorite(item.id)}
                            aria-label="Favorite service"
                          >
                            {favorites.includes(item.id) ? "★" : "☆"}
                          </button>
                        </div>

                        <div className="service-id">
                          {item.id}
                        </div>

                        <div className="service-title">
                          {item.service}
                        </div>

                        <div className="service-rate">
                          {currencySymbols[currency]}
                          {Number(item.rate).toFixed(2)}
                        </div>

                        <div className="service-min">
                          {formatNumber(item.min_order)}
                        </div>
                        <div className="service-min">
                          {formatNumber(item.max_order)}
                        </div>
                        <div className="service-min">
                          {formatNumber(item.average_time)}
                        </div>
                        <div className="service-min">
                          {formatNumber(item.min_order)}
                        </div>

                        {/* Click row to view complete service details */}
                        <button
                          type="button"
                          className="service-row-click"
                          onClick={() => setSelectedService(item)}
                          aria-label={`View service ${item.id}`}
                        />
                      </div>
                    ))}
                  </div>
                )
              )
            )}
          </section>
        )}

      </main>

      {/* Service details modal */}
      {selectedService && (
        <div
          className="modal-overlay"
          onClick={() => setSelectedService(null)}
        >
          <div
            className="service-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="close-modal"
              onClick={() => setSelectedService(null)}
              type="button"
            >
              ×
            </button>

            <span className="modal-id">
              Service #{selectedService.id}
            </span>

            <h2>{selectedService.category}</h2>

            <p className="modal-service-name">
              {selectedService.service}
            </p>

            <div className="modal-details">
              <div>
                <span>Rate / 1000</span>
                <strong>
                  {currencySymbols[currency]}
                  {Number(selectedService.rate).toFixed(2)}
                </strong>
              </div>

              <div>
                <span>Minimum Order</span>
                <strong>
                  {formatNumber(selectedService.min_order)}
                </strong>
              </div>

              <div>
                <span>Maximum Order</span>
                <strong>
                  {formatNumber(selectedService.max_order)}
                </strong>
              </div>

              <div>
                <span>Average Time</span>
                <strong>
                  {selectedService.average_time || "—"}
                </strong>
              </div>
            </div>

            <button
              className="modal-close-btn"
              onClick={() => setSelectedService(null)}
              type="button"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <WhatsAppButton />
    </div>
  );
}

export default DashboardServices;
