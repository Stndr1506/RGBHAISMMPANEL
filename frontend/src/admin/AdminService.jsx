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

const API_URL = process.env.REACT_APP_API_URL;

const AdminService = () => {
  // ================================
  // STATE
  // ================================

  const [servicesData, setServicesData] = useState([]);
  const [search, setSearch] = useState("");
  const [currency, setCurrency] = useState("INR ₹");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal
  const [showModal, setShowModal] = useState(false);

  // Edit mode
  const [editingService, setEditingService] = useState(null);

  // Form
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

  const [saving, setSaving] = useState(false);

//   const getAuthConfig = () => {
//   const token = localStorage.getItem("token");

//   return {
//     headers: {
//       Authorization: `Bearer ${token}`,
//     },
//   };
// };
  // ================================
  // FETCH SERVICES
  // ================================

  
  const fetchServices = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${API_URL}/api/admin-service`,    //${API_URL}
        {
          headers:{
            Authorization: `Bearer ${token}`,
          }
        }
      );

      // if (response.data.success) {
      //   setServicesData(response.data.services || []);
      // } else {
      //   setError("Failed to load services.");
      // }
      if (Array.isArray(response.data)) {
      setServicesData(response.data);
    } else {
      setServicesData([]);
      setError("Invalid services response from server.");
    }

    } catch (err) {
      console.error("Error fetching services:", err);

      setError(
        "Unable to load services. Please try again."
      );

    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchServices();
  }, []);


  // ================================
  // CATEGORIES
  // ================================

  const categories = [
    "All",
    ...new Set(
      servicesData
        .map((item) => item.category)
        .filter(Boolean)
    ),
  ];


  // ================================
  // SEARCH + CATEGORY
  // ================================

  const filteredServices = servicesData.filter(
    (service) => {

      const searchText =
        search.toLowerCase().trim();

      const serviceName =
        (service.service || "").toLowerCase();

      const category =
        (service.category || "").toLowerCase();

      const id =
        service.id?.toString() || "";

      const matchesSearch =
        serviceName.includes(searchText) ||
        category.includes(searchText) ||
        id.includes(searchText);

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
  // FORMAT NUMBER
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
  // RATE
  // ================================

  const getRate = (rate) => {

    const numericRate =
      Number(rate || 0);

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
      `Service Name: ${service.service}\n\n` +
      `Service ID: ${service.id}\n\n` +
      `Rate: ${service.rate}\n\n` +
      `Average Time: ${
        service.average_time || "Not available"
      }\n\n` +
      `Description: ${
        service.description ||
        "No description available."
      }`
    );
  };


  // ================================
  // OPEN ADD MODAL
  // ================================

  const handleAddService = () => {

    setEditingService(null);

    setFormData({
      category: "",
      service: "",
      rate: "",
      min_order: "",
      max_order: "",
      average_time: "",
      description: "",
      
    });

    setShowModal(true);
  };


  // ================================
  // OPEN EDIT MODAL
  // ================================

  const handleEditService = (service) => {

    setEditingService(service);

    setFormData({
      category: service.category || "",
      service: service.service || "",
      description: service.description || "",
      rate: service.rate || "",
      min_order: service.min_order || "",
      max_order: service.max_order || "",
      average_time: service.average_time || "",
      
      icon: service.icon || "⭐",
    });

    setShowModal(true);
  };


  // ================================
  // FORM CHANGE
  // ================================

  const handleChange = (e) => {

    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };


  // ================================
  // SAVE SERVICE
  // ================================

  const handleSubmit = async (e) => {
  e.preventDefault();

  // ================================
  // VALIDATION
  // ================================

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

  try {
    setSaving(true);

    const token = localStorage.getItem("token");

    if (!token) {
      alert("Session expired. Please login again.");
      return;
    }

    let response;

    // ================================
    // UPDATE SERVICE
    // ================================

    if (editingService) {
      response = await axios.put(
        `${API_URL}/api/admin-service/${editingService.id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    }

    // ================================
    // ADD SERVICE
    // ================================

    else {
      
      response = await axios.post(
        `${API_URL}/api/admin-service`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    }

    console.log("SAVE API RESPONSE:", response.data);

    // Axios considers 2xx responses successful.
    // So don't depend on response.data.success.
    if (response.status >= 200 && response.status < 300) {
      
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

      // Refresh service list
      await fetchServices();

    } else {
      alert(
        response.data?.message ||
        "Operation failed."
      );
    }

  } catch (err) {
    console.error("Service save error:", err);

    console.error("Status:", err.response?.status);
    console.error("API response:", err.response?.data);

    alert(
      err.response?.data?.message ||
      "Something went wrong while saving service."
    );

  } finally {
    setSaving(false);
  }
};
  // ================================
  // DELETE SERVICE
  // ================================

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

        alert(
          "Service deleted successfully."
        );

        fetchServices();

      } else {

        alert(
          response.data.message ||
          "Unable to delete service."
        );
      }

    } catch (err) {

      console.error(
        "Delete service error:",
        err
      );

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

      <AdminHome/>


      {/* =================================
          ADMIN HEADER
      ================================= */}

      <div className="services-admin-header">

        <div>

          <h1>
            Service Management
          </h1>

          <p>
            Add, update and manage your SMM services.
          </p>

        </div>


        <button
          className="add-service-btn"
          onClick={handleAddService}
        >
          ＋ Add Service
        </button>

      </div>


      {/* =================================
          FILTER AREA
      ================================= */}

      <div className="services-filter-card">

        <select
          className="filter-select"
          value={selectedCategory}
          onChange={(e) =>
            setSelectedCategory(
              e.target.value
            )
          }
        >

          {categories.map((category) => (

            <option
              key={category}
              value={category}
            >
              {category}
            </option>

          ))}

        </select>


        <select
          className="currency-select"
          value={currency}
          onChange={(e) =>
            setCurrency(e.target.value)
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


        <div className="search-box">

          <input
            type="text"
            placeholder="Search service..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
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

        <div className="table-header">

          <div>ID</div>

          <div className="header-service">
            Service
          </div>

          <div>
            Rate per 1000
          </div>

          <div>
            Min order
          </div>

          <div>
            Max order
          </div>

          <div>
            Average time
          </div>

          <div>
            Description
          </div>

          <div>
            Actions
          </div>

        </div>


        {/* LOADING */}

        {loading && (

          <div className="no-services">
            Loading services...
          </div>

        )}


        {/* ERROR */}

        {!loading && error && (

          <div className="no-services">
            {error}
          </div>

        )}


        {/* SERVICES */}

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

                  {/* CATEGORY */}

                  {showCategory && (

                    <div className="category-row">

                      {/* <span className="category-icon">

                        {service.icon || "⭐"}

                      </span> */}
                      <span className="category-icon">
                        {getCategoryIcon(service.category) ? (
                        <FontAwesomeIcon
                        icon={getCategoryIcon(service.category)}
                        />
                      ) : (
                        "⭐"
                        )}
                      </span>

                      <span>
                        {service.category}
                      </span>

                    </div>

                  )}


                  {/* SERVICE */}

                  <div className="service-row">

                    <div className="service-id">
                      {service.id}
                    </div>


                    <div className="service-name">
                      {service.service}
                    </div>


                    <div className="service-rate">
                      {getRate(service.rate)}
                    </div>


                    <div>
                      {formatNumber(
                        service.min_order
                      )}
                    </div>


                    <div>
                      {formatNumber(
                        service.max_order
                      )}
                    </div>


                    <div>
                      {service.average_time ||
                        "Not available"}
                    </div>


                    <div className="view-column">

                      <button
                        type="button"
                        className="view-btn"
                        onClick={() =>
                          handleView(service)
                        }
                      >
                        View
                      </button>

                    </div>


                    {/* ACTIONS */}

                    <div className="service-actions">

                      <button
                        className="edit-btn"
                        onClick={() =>
                          handleEditService(
                            service
                          )
                        }
                      >
                        📝Edit
                      </button>


                      <button
                        className="delete-btn"
                        onClick={() =>
                          handleDeleteService(
                            service
                          )
                        }
                      >
                        ❌ Delete
                      </button>

                    </div>

                  </div>

                </React.Fragment>
              );
            }
          )}


        {/* NO SERVICES */}

        {!loading &&
          !error &&
          filteredServices.length === 0 && (

            <div className="no-services">
              No services found.
            </div>

          )}

      </div>


      {/* =================================
          ADD / EDIT MODAL
      ================================= */}

      {showModal && (

        <div className="service-modal-overlay">

          <div className="service-modal">

            <div className="modal-header">

              <h2>
                {editingService
                  ? "Update Service"
                  : "Add New Service"}
              </h2>

              <button
                className="modal-close"
                onClick={() =>
                  setShowModal(false)
                }
              >
                ✕
              </button>

            </div>


            <form
              onSubmit={handleSubmit}
              className="service-form"
            >

              {/* CATEGORY */}

              <div className="form-group">

                <label>
                  Category *
                </label>

                <input
                  type="text"
                  name="category"
                  placeholder="Instagram"
                  value={formData.category}
                  onChange={handleChange}
                />

              </div>


              {/* SERVICE */}

              <div className="form-group">

                <label>
                  Service Name *
                </label>

                <input
                  type="text"
                  name="service"
                  placeholder="Instagram Followers"
                  value={formData.service}
                  onChange={handleChange}
                />

              </div>

              {/* DESCRIPTION */}

              <div className="form-group">

                <label>
                  Description
                </label>

                <textarea
                  name="description"
                  placeholder="Enter service description..."
                  value={formData.description}
                  onChange={handleChange}
                  rows="4"
                />

              </div>


              <div className="form-row">

                {/* RATE */}

                <div className="form-group">

                  <label>
                    Rate per 1000 *
                  </label>

                  <input
                    type="number"
                    step="0.01"
                    name="rate"
                    placeholder="36.17"
                    value={formData.rate}
                    onChange={handleChange}
                  />

                </div>


                {/* ICON */}

                {/* <div className="form-group">

                  <label>
                    Category Icon
                  </label>

                  <input
                    type="text"
                    name="icon"
                    placeholder="⭐"
                    value={formData.icon}
                    onChange={handleChange}
                  />

                </div> */}

              </div>


              <div className="form-row">

                {/* MIN */}

                <div className="form-group">

                  <label>
                    Minimum Order *
                  </label>

                  <input
                    type="number"
                    name="min_order"
                    placeholder="100"
                    value={formData.min_order}
                    onChange={handleChange}
                  />

                </div>


                {/* MAX */}

                <div className="form-group">

                  <label>
                    Maximum Order *
                  </label>

                  <input
                    type="number"
                    name="max_order"
                    placeholder="50000"
                    value={formData.max_order}
                    onChange={handleChange}
                  />

                </div>

              </div>


              {/* AVERAGE TIME */}

              <div className="form-group">

                <label>
                  Average Time
                </label>

                <input
                  type="text"
                  name="average_time"
                  placeholder="0-24 hours"
                  value={formData.average_time}
                  onChange={handleChange}
                />

              </div>


              


              {/* BUTTONS */}

              <div className="modal-actions">

                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() =>
                    setShowModal(false)
                  }
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
  );
};

export default AdminService;