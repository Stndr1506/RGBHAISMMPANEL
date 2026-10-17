
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/Services.css";

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

import AdminHome from "./AdminHome";
import AdminNavbar from "../components/AdminNavbar";

const API_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000";

const createEmptyService = () => ({
  category: "",
  service: "",
  rate: "",
  min_order: "",
  max_order: "",
  average_time: "",
  description: "",
});

const AdminService = () => {
  // =====================================
  // STATE
  // =====================================

  const [servicesData, setServicesData] = useState([]);
  const [search, setSearch] = useState("");
  const [currency, setCurrency] = useState("INR ₹");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Single service modal
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [saving, setSaving] = useState(false);

  // Bulk service modal
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bulkError, setBulkError] = useState("");
  const [bulkServices, setBulkServices] = useState([
    createEmptyService(),
    createEmptyService(),
  ]);

  // Single service form
  const [formData, setFormData] = useState({
    category: "",
    service: "",
    rate: "",
    min_order: "",
    max_order: "",
    average_time: "",
    description: "",
    icon: "⭐",
  });

  // =====================================
  // FETCH SERVICES
  // =====================================

  const fetchServices = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      const response = await axios.get(
        `${API_URL}/api/admin-service`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (Array.isArray(response.data)) {
        setServicesData(response.data);
      } else {
        setServicesData([]);
        setError("Invalid services response from server.");
      }
    } catch (err) {
      console.error("Error fetching services:", err);
      setError("Unable to load services. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  // =====================================
  // CATEGORIES
  // =====================================

  const categories = [
    "All",
    ...new Set(
      servicesData
        .map((item) => item.category)
        .filter(Boolean)
    ),
  ];

  // =====================================
  // SEARCH + CATEGORY
  // =====================================

  const filteredServices = servicesData.filter((service) => {
    const searchText = search.toLowerCase().trim();
    const serviceName = (service.service || "").toLowerCase();
    const category = (service.category || "").toLowerCase();
    const id = service.id?.toString() || "";

    const matchesSearch =
      serviceName.includes(searchText) ||
      category.includes(searchText) ||
      id.includes(searchText);

    const matchesCategory =
      selectedCategory === "All" ||
      service.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // =====================================
  // FORMAT NUMBER
  // =====================================

  const formatNumber = (number) => {
    if (number === null || number === undefined) {
      return "0";
    }

    return Number(number).toLocaleString("en-IN");
  };

  // =====================================
  // FORMAT RATE
  // =====================================

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

  // =====================================
  // VIEW SERVICE DESCRIPTION
  // =====================================

  const handleView = (service) => {
    alert(
      `Service Name: ${service.service}\n\n` +
        `Service ID: ${service.id}\n\n` +
        `Rate: ${service.rate}\n\n` +
        `Average Time: ${
          service.average_time || "Not available"
        }\n\n` +
        `Description: ${
          service.description || "No description available."
        }`
    );
  };

  // =====================================
  // OPEN ADD SERVICE MODAL
  // =====================================

  // const handleAddService = () => {
  //   setEditingService(null);

  //   setFormData({
  //     category: "",
  //     service: "",
  //     rate: "",
  //     min_order: "",
  //     max_order: "",
  //     average_time: "",
  //     description: "",
  //     icon: "⭐",
  //   });

  //   setShowModal(true);
  // };

  
const handleAddService = (category = "") => {
  setEditingService(null);

  setFormData({
    category: category || categories.find((item) => item !== "All") || "",
    service: "",
    rate: "",
    min_order: "",
    max_order: "",
    average_time: "",
    description: "",
    icon: "⭐",
  });

  setShowModal(true);
};

  // =====================================
  // OPEN EDIT SERVICE MODAL
  // =====================================

  const handleEditService = (service) => {
    setEditingService(service);

    setFormData({
      category: service.category || "",
      service: service.service || "",
      description: service.description || "",
      rate: service.rate ?? "",
      min_order: service.min_order ?? "",
      max_order: service.max_order ?? "",
      average_time: service.average_time || "",
      icon: service.icon || "⭐",
    });

    setShowModal(true);
  };

  // =====================================
  // SINGLE FORM CHANGE
  // =====================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =====================================
  // SAVE SINGLE SERVICE
  // =====================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.category.trim() ||
      !formData.service.trim() ||
      formData.rate === "" ||
      formData.min_order === "" ||
      formData.max_order === ""
    ) {
      alert("Please fill all required fields.");
      return;
    }

    const rate = Number(formData.rate);
    const minOrder = Number(formData.min_order);
    const maxOrder = Number(formData.max_order);

    if (
      !Number.isFinite(rate) ||
      rate < 0 ||
      !Number.isInteger(minOrder) ||
      !Number.isInteger(maxOrder) ||
      minOrder < 0 ||
      maxOrder < minOrder
    ) {
      alert("Please enter valid rates and order limits.");
      return;
    }

    try {
      setSaving(true);

      const token = localStorage.getItem("token");

      if (!token) {
        alert("Session expired. Please login again.");
        return;
      }

      // let response;

     if (editingService) {
  await axios.put(
    `${API_URL}/api/admin-service/${editingService.id}`,
    formData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
} else {
  await axios.post(
    `${API_URL}/api/admin-service`,
    formData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
}
      alert(
        editingService
          ? "Service updated successfully."
          : "Service added successfully."
      );

      setShowModal(false);
      setEditingService(null);

      setFormData({
        category: "",
        service: "",
        rate: "",
        min_order: "",
        max_order: "",
        average_time: "",
        description: "",
        icon: "⭐",
      });

      await fetchServices();
    } catch (err) {
      console.error(
        "Service save error:",
        err.response?.data || err
      );

      alert(
        err.response?.data?.message ||
          "Something went wrong while saving service."
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================
  // BULK SERVICE FORM FUNCTIONS
  // =====================================

  const handleBulkChange = (index, field, value) => {
    setBulkServices((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    );
  };

  const addBulkRow = () => {
    setBulkServices((prev) => [
      ...prev,
      createEmptyService(),
    ]);
  };

  const removeBulkRow = (index) => {
    setBulkServices((prev) =>
      prev.filter((_, i) => i !== index)
    );
  };

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    setBulkError("");

    const invalidService = bulkServices.some((item) => {
      const rate = Number(item.rate);
      const min = Number(item.min_order);
      const max = Number(item.max_order);

      return (
        !item.category.trim() ||
        !item.service.trim() ||
        item.rate.trim() === "" ||
        item.min_order.trim() === "" ||
        item.max_order.trim() === "" ||
        !Number.isFinite(rate) ||
        !Number.isInteger(min) ||
        !Number.isInteger(max) ||
        rate < 0 ||
        min < 0 ||
        max < min
      );
    });

    if (invalidService) {
      setBulkError(
        "Complete all required fields and check the numeric values."
      );
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      setBulkError("Session expired. Please log in again.");
      return;
    }

    const services = bulkServices.map((item) => ({
      category: item.category.trim(),
      service: item.service.trim(),
      rate: Number(item.rate),
      min_order: Number(item.min_order),
      max_order: Number(item.max_order),
      average_time: item.average_time.trim(),
      description: item.description.trim(),
    }));

    try {
      setBulkSaving(true);

      const response = await axios.post(
        `${API_URL}/api/admin-service/bulk`,
        { services },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.data?.success) {
        setBulkError(
          response.data?.message || "Unable to save services."
        );
        return;
      }

      alert(
        `${response.data.count ?? services.length} services added successfully.`
      );

      setShowBulkModal(false);
      setBulkServices([
        createEmptyService(),
        createEmptyService(),
      ]);

      await fetchServices();
    } catch (err) {
      console.error(
        "Bulk service error:",
        err.response?.data || err
      );

      setBulkError(
        err.response?.data?.message ||
          "Unable to save services. Check your backend endpoint."
      );
    } finally {
      setBulkSaving(false);
    }
  };

  // =====================================
  // DELETE SERVICE
  // =====================================

  const handleDeleteService = async (service) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${service.service}"?`
    );

    if (!confirmDelete) {
      return;
    }

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        alert("Session expired. Please login again.");
        return;
      }

      const response = await axios.delete(
        `${API_URL}/api/admin-service/${service.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        alert("Service deleted successfully.");
        await fetchServices();
      } else {
        alert(
          response.data.message || "Unable to delete service."
        );
      }
    } catch (err) {
      console.error("Delete service error:", err);

      alert(
        err.response?.data?.message ||
          "Something went wrong while deleting service."
      );
    }
  };

  // =====================================
  // CATEGORY SOCIAL ICON
  // =====================================

  const getCategoryIcon = (category) => {
    const name = (category || "").toLowerCase();

    if (name.includes("instagram")) return faInstagram;

    if (name.includes("youtube") || name.includes("you tube")) {
      return faYoutube;
    }

    if (name.includes("telegram")) return faTelegram;

    if (name.includes("twitter") || name === "x") {
      return faTwitter;
    }

    if (name.includes("facebook")) return faFacebook;
    if (name.includes("tiktok")) return faTiktok;
    if (name.includes("snapchat")) return faSnapchat;
    if (name.includes("linkedin")) return faLinkedin;

    return null;
  };

  // =====================================
  // UI
  // =====================================

  return (
    <>
    <AdminNavbar/>
    
    <div className="services-page">
      <AdminHome />

      {/* ADMIN HEADER */}
      <div className="services-admin-header">
        <div>
          <h1>Service Management</h1>
          <p>Add, update and manage your SMM services.</p>
        </div>

        <div className="service-header-actions">
          <button
            type="button"
            className="bulk-service-btn"
            onClick={() => {
              setBulkError("");
              setShowBulkModal(true);
            }}
          >
            + Add Multiple Services
          </button>

          <button
            type="button"
            className="add-service-btn"
            onClick={handleAddService}
          >
            + Add Service
          </button>
        </div>
      </div>

      {/* FILTER AREA */}
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
            placeholder="Search service..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <button className="search-btn" type="button">
            🔍
          </button>
        </div>
      </div>

      {/* SERVICES TABLE */}
      <div className="services-table-card">
        <div className="table-header">
          <div>ID</div>
          <div className="header-service">Service</div>
          <div>Rate per 1000</div>
          <div>Min order</div>
          <div>Max order</div>
          <div>Average time</div>
          <div>Description</div>
          <div>Actions</div>
        </div>

        {loading && (
          <div className="no-services">Loading services...</div>
        )}

        {!loading && error && (
          <div className="no-services">{error}</div>
        )}

        {!loading &&
          !error &&
          filteredServices.length > 0 &&
          filteredServices.map((service, index) => {
            const previousCategory =
              index > 0
                ? filteredServices[index - 1].category
                : null;

            const showCategory =
              index === 0 || previousCategory !== service.category;

            const categoryIcon = getCategoryIcon(service.category);

            return (
              <React.Fragment key={service.id}>
                {showCategory && (
                  <div className="category-row">
                    <span className="category-icon">
                      {categoryIcon ? (
                        <FontAwesomeIcon icon={categoryIcon} />
                      ) : (
                        "⭐"
                      )}
                    </span>

                    <span>{service.category}</span>
                  </div>
                )}

                <div className="service-row">
                  <div className="service-id">{service.id}</div>

                  <div className="service-name">
                    {service.service}
                  </div>

                  <div className="service-rate">
                    {getRate(service.rate)}
                  </div>

                  <div>{formatNumber(service.min_order)}</div>
                  <div>{formatNumber(service.max_order)}</div>

                  <div>
                    {service.average_time || "Not available"}
                  </div>

                  <div className="view-column">
                    <button
                      type="button"
                      className="view-btn"
                      onClick={() => handleView(service)}
                    >
                      View
                    </button>
                  </div>

                  <div className="service-actions">
                    <button
                        type="button"
                        className="add-row-btn"
                        onClick={() => handleAddService(service.category)}
                        title={`Add service under ${service.category}`}
                      >
                        ➕ Add
                      </button>
                    <button
                      type="button"
                      className="add-row-btn"
                      onClick={() => handleEditService(service)}
                    >
                      📝 Edit
                    </button>

                    <button
                      type="button"
                      className="add-row-btn"
                      onClick={() => handleDeleteService(service)}
                    >
                      ❌ Delete
                    </button>
                  </div>
                </div>
              </React.Fragment>
            );
          })}

        {!loading &&
          !error &&
          filteredServices.length === 0 && (
            <div className="no-services">No services found.</div>
          )}
      </div>

      {/* BULK ADD SERVICES MODAL */}
      {showBulkModal && (
        <div className="service-modal-overlay">
          <div className="service-modal bulk-service-modal">
            <div className="modal-header">
              <h2>Add Multiple Services</h2>

              <button
                type="button"
                className="modal-close"
                disabled={bulkSaving}
                onClick={() => setShowBulkModal(false)}
              >
                ✕
              </button>
            </div>

            <form
              className="service-form"
              onSubmit={handleBulkSubmit}
            >
              <p className="bulk-service-help">
                Fill each row for a separate service. Add or remove
                rows before saving.
              </p>

              {bulkServices.map((item, index) => (
                <div className="bulk-service-row" key={index}>
                  <div className="bulk-row-heading">
                    <strong>Service {index + 1}</strong>

                    <button
                      type="button"
                      className="bulk-remove-btn"
                      disabled={bulkServices.length === 1 || bulkSaving}
                      onClick={() => removeBulkRow(index)}
                    >
                      Remove
                    </button>
                  </div>

                  <div className="form-group">
                    <label>Category *</label>
                    <input
                      type="text"
                      required
                      value={item.category}
                      placeholder="Instagram"
                      onChange={(e) =>
                        handleBulkChange(
                          index,
                          "category",
                          e.target.value
                        )
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>Service Name *</label>
                    <input
                      type="text"
                      required
                      value={item.service}
                      placeholder="Instagram Followers"
                      onChange={(e) =>
                        handleBulkChange(
                          index,
                          "service",
                          e.target.value
                        )
                      }
                    />
                  </div>

                  <div className="bulk-numeric-grid">
                    <div className="form-group">
                      <label>Rate per 1000 *</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        value={item.rate}
                        placeholder="36.17"
                        onChange={(e) =>
                          handleBulkChange(
                            index,
                            "rate",
                            e.target.value
                          )
                        }
                      />
                    </div>

                    <div className="form-group">
                      <label>Minimum Order *</label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        required
                        value={item.min_order}
                        placeholder="100"
                        onChange={(e) =>
                          handleBulkChange(
                            index,
                            "min_order",
                            e.target.value
                          )
                        }
                      />
                    </div>

                    <div className="form-group">
                      <label>Maximum Order *</label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        required
                        value={item.max_order}
                        placeholder="50000"
                        onChange={(e) =>
                          handleBulkChange(
                            index,
                            "max_order",
                            e.target.value
                          )
                        }
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Average Time</label>
                    <input
                      type="text"
                      value={item.average_time}
                      placeholder="0-24 hours"
                      onChange={(e) =>
                        handleBulkChange(
                          index,
                          "average_time",
                          e.target.value
                        )
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      rows="2"
                      value={item.description}
                      placeholder="Service description"
                      onChange={(e) =>
                        handleBulkChange(
                          index,
                          "description",
                          e.target.value
                        )
                      }
                    />
                  </div>
                </div>
              ))}

              {bulkError && (
                <div className="bulk-service-error" role="alert">
                  {bulkError}
                </div>
              )}

              <button
                type="button"
                className="bulk-add-row-btn"
                disabled={bulkSaving}
                onClick={addBulkRow}
              >
                + Add Another Service
              </button>

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  disabled={bulkSaving}
                  onClick={() => setShowBulkModal(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="save-service-btn"
                  disabled={bulkSaving}
                >
                  {bulkSaving
                    ? "Saving Services..."
                    : `Save ${bulkServices.length} Services`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD / EDIT SINGLE SERVICE MODAL */}
      {showModal && (
        <div className="service-modal-overlay">
          <div className="service-modal">
            <div className="modal-header">
              <h2>
                {editingService ? "Update Service" : "Add New Service"}
              </h2>

              <button
                type="button"
                className="modal-close"
                onClick={() => setShowModal(false)}
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="service-form"
            >
              <div className="form-group">
                <label>Category *</label>
                {/* <input
                  type="text"
                  name="category"
                  placeholder="Instagram"
                  value={formData.category}
                  onChange={handleChange}
                  required
                /> */}
                
<div className="form-group">
  <label>Category *</label>

  <select
    name="category"
    value={formData.category}
    onChange={handleChange}
    required
  >
    <option value="" disabled>
      Select category
    </option>

    {[...new Set([
      ...categories.filter((category) => category !== "All"),
      ...(formData.category ? [formData.category] : []),
    ])].map((category) => (
      <option key={category} value={category}>
        {category}
      </option>
    ))}
  </select>
</div>

              </div>

              <div className="form-group">
                <label>Service Name *</label>
                <input
                  type="text"
                  name="service"
                  placeholder="Instagram Followers"
                  value={formData.service}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  placeholder="Enter service description..."
                  value={formData.description}
                  onChange={handleChange}
                  rows="4"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Rate per 1000 *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    name="rate"
                    placeholder="36.17"
                    value={formData.rate}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Minimum Order *</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    name="min_order"
                    placeholder="100"
                    value={formData.min_order}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Maximum Order *</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    name="max_order"
                    placeholder="50000"
                    value={formData.max_order}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Average Time</label>
                <input
                  type="text"
                  name="average_time"
                  placeholder="0-24 hours"
                  value={formData.average_time}
                  onChange={handleChange}
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="save-service-btn"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingService
                    ? "Update Service"
                    : "Add Service"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default AdminService;
