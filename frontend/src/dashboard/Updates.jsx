import React, { useState } from "react";
import "../styles/Updates.css";
import WhatsAppButton from "../components/WhatsappButton";

const services = [
  {
    id: "5547",
    service:
      "TikTok Followers Real Mix Account (300k) Days Refill",
    date: "2026-09-25",
    update: "Rate decreased from ₹252.32 to ₹252.30",
  },
  {
    id: "5546",
    service:
      "TikTok Followers Real Mix Account 15 Days Refill",
    date: "2026-09-25",
    update: "Rate decreased from ₹232.92 to ₹232.90",
  },
  {
    id: "5545",
    service:
      "TikTok Followers Instant 1M [%40 PP] [Slow] Day 1k-3k",
    date: "2026-09-25",
    update: "Rate decreased from ₹19.44 to ₹19.41",
  },
  {
    id: "5541",
    service:
      "Ultra Fast Tiktok Followers Real Mix Account (300k) Day 50k",
    date: "2026-09-25",
    update: "Rate decreased from ₹178.57 to ₹178.55",
  },
  {
    id: "5540",
    service:
      "Ultra Fast Tiktok Followers Real Mix Account (Days 20k)",
    date: "2026-09-25",
    update: "Rate decreased from ₹160.45 to ₹160.44",
  },
  {
    id: "5536",
    service:
      "TikTok Like [SuperCheap] Instant 1M [%40 PP] [30 Day]%20 Drop",
    date: "2026-09-25",
    update: "Rate decreased from ₹28.51 to ₹28.47",
  },
  {
    id: "5524",
    service:
      "♻️ ♻️ Service Note: - S2 Different Base - 50-60 Min START TIME- Low Drop ♻️♻️",
    date: "2026-09-25",
    update: "Rate decreased from ₹129420.60 to ₹129265.29",
  },
  {
    id: "5523",
    service:
      "NEWServer 2 Tiktok Followers Low Drop Mix(30 Days Refill)",
    date: "2026-09-25",
    update: "Rate decreased from ₹233.20 to ₹232.92",
  },
];

const filters = [
  "All",
  "New service",
  "Rate decreased",
  "Rate increased",
  "Service enabled",
  "Service disabled",
];

function Updates() {
  const [filter, setFilter] = useState("Rate decreased");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredServices = services.filter((item) =>
    item.service.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page">

      <main className="container">

        {/* ================= TOP FILTER CARD ================= */}
        <section className="filter-card">

          <div className="filter-row">

            <div className="filter-wrapper">

              <button
                className="filter-select"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                <span>{filter}</span>
                <span className="arrow">
                  {dropdownOpen ? "▲" : "▼"}
                </span>
              </button>

              {dropdownOpen && (
                <div className="dropdown">

                  {filters.map((item) => (
                    <button
                      key={item}
                      className={`dropdown-item ${
                        filter === item ? "active" : ""
                      }`}
                      onClick={() => {
                        setFilter(item);
                        setDropdownOpen(false);
                      }}
                    >
                      {item}
                    </button>
                  ))}

                </div>
              )}

            </div>


            {/* SEARCH */}
            <div className="search-wrapper">

              <input
                type="text"
                placeholder="Search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              <button className="search-button">
                <span>⌕</span>
              </button>

            </div>

          </div>

        </section>


        {/* ================= SERVICE TABLE ================= */}
        <section className="table-card">

          <div className="table-header">

            <div className="service-heading">
              Service
            </div>

            <div className="date-heading">
              Date
            </div>

            <div className="update-heading">
              Update
            </div>

          </div>


          <div className="service-list">

            {filteredServices.map((item, index) => (

              <div className="service-row" key={item.id}>

                {/* SERVICE */}
                <div className="service-cell">

                  <span className="service-id">
                    {item.id}
                  </span>

                  <span className="service-name">
                    {item.service}
                  </span>

                </div>


                {/* DATE */}
                <div className="date-cell">
                  {item.date}
                </div>


                {/* UPDATE */}
                <div className="update-cell">
                  {item.update}
                </div>

              </div>

            ))}

          </div>

        </section>

      </main>

    <WhatsAppButton/>

    </div>
  );
}

export default Updates;
