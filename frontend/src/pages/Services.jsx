import React, { useState } from "react";
import "../styles/Services.css";
import Home from "./Home";

const servicesData = [
  {
    id: 5414,
    category: "Telegram Services",
    icon: "⭐",
    service: "Growfastsmm.Com",
    rate: "₹100000000.00",
    min: "1 000",
    max: "1 000",
    time: "1 hour",
  },
  {
    id: 35,
    category: "Instagram Views",
    icon: "📷",
    service: "Instagram Views [ Reels / Videos / TV ] [ Instant ] [ Cheapest ]",
    rate: "₹0.16",
    min: "100",
    max: "100 000 000",
    time: "1 hour 2 minutes",
  },
  {
    id: 4505,
    category: "Instagram Views",
    icon: "📷",
    service: "Instagram Views - Reels - Instant",
    rate: "₹0.32",
    min: "100",
    max: "100 000 000",
    time: "32 minutes",
  },
  {
    id: 2721,
    category: "Instagram Views",
    icon: "📷",
    service: "Instagram Views [ Super fast ] 🚀 [ Working After Update ]",
    rate: "₹1.35",
    min: "100",
    max: "100 000 000",
    time: "27 minutes",
  },
  {
    id: 4990,
    category: "Instagram | Followers [ No Refill ]",
    icon: "📷",
    service:
      "Instagram Followers [High Quality + Real] [No Refill] [50-100K/D] [Instant]",
    rate: "₹36.21",
    min: "50",
    max: "100 000",
    time: "1 hour 31 minutes",
  },
  {
    id: 5001,
    category: "Instagram | Followers [ Non Drop ]",
    icon: "📷",
    service: "Instagram Followers [ Non Drop ] ⚠️",
    rate: "₹42.50",
    min: "100",
    max: "50 000",
    time: "2 hours",
  },
  {
    id: 6001,
    category: "YouTube Views",
    icon: "▶️",
    service: "YouTube Views [ High Retention ] [ Instant ]",
    rate: "₹5.50",
    min: "100",
    max: "1 000 000",
    time: "30 minutes",
  },
  {
    id: 7001,
    category: "Facebook Services",
    icon: "🔵",
    service: "Facebook Page Followers [ Real ]",
    rate: "₹25.00",
    min: "100",
    max: "100 000",
    time: "1 hour",
  },
];

const Services = () => {
  const [search, setSearch] = useState("");
  const [currency, setCurrency] = useState("INR ₹");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const categories = [
    "All",
    ...new Set(servicesData.map((item) => item.category)),
  ];

  const filteredServices = servicesData.filter((service) => {
    const searchText = search.toLowerCase();

    const matchesSearch =
      service.service.toLowerCase().includes(searchText) ||
      service.category.toLowerCase().includes(searchText) ||
      service.id.toString().includes(searchText);

    const matchesCategory =
      selectedCategory === "All" ||
      service.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    
    <div className="services-page">
      <Home/>
      {/* Search / Filter Area */}
      <div className="services-filter-card">

        <select
          className="filter-select"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>

        <select
          className="currency-select"
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
        >
          <option value="INR ₹">INR ₹</option>
          <option value="USD $">USD $</option>
          <option value="EUR €">EUR €</option>
        </select>

        <div className="search-box"> 
          <input
            type="text"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <button className="search-btn">
            🔍
          </button>
        </div>

      </div>

      {/* Services Table */}
      <div className="services-table-card">

        {/* Table Header */}
        <div className="table-header">
          <div>ID</div>
          <div>Service</div>
          <div>Rate per 1000</div>
          <div>Min order</div>
          <div>Max order</div>
          <div>Average time ⓘ</div>
          <div>Description</div>
        </div>

        {/* Services */}
        {filteredServices.length > 0 ? (
          filteredServices.map((service, index) => {

            const previousCategory =
              index > 0
                ? filteredServices[index - 1].category
                : null;

            const showCategory =
              index === 0 || previousCategory !== service.category;

            return (
              <React.Fragment key={service.id}>

                {/* Category */}
                {showCategory && (
                  <div className="category-row">
                    <span className="category-icon">
                      {service.icon}
                    </span>

                    <span>{service.category}</span>
                  </div>
                )}

                {/* Service Row */}
                <div className="service-row">

                  <div className="service-id">
                    {service.id}
                  </div>

                  <div className="service-name">
                    {service.service}
                  </div>

                  <div className="service-rate">
                    {currency === "INR ₹"
                      ? service.rate
                      : currency === "USD $"
                      ? "$0.01"
                      : "€0.01"}
                  </div>

                  <div>{service.min}</div>

                  <div>{service.max}</div>

                  <div>{service.time}</div>

                  <div className="view-column">
                    <button
                      className="view-btn"
                      onClick={() =>
                        alert(
                          `Service ID: ${service.id}\n${service.service}`
                        )
                      }
                    >
                      View
                    </button>
                  </div>

                </div>

              </React.Fragment>
            );
          })
        ) : (
          <div className="no-services">
            No services found.
          </div>
        )}

      </div>

      {/* WhatsApp Button */}
      <div className="services-whatsapp">
        ☎
      </div>

    </div>
  );
};

export default Services;
