import React, { useEffect, useMemo, useState } from "react";
import "../styles/DashboardServices.css";
// import Home from "../pages/Home";
import AdminHome from "./AdminHome";

// Change this if your backend is hosted somewhere else
const API_URL = `${process.env.REACT_APP_API_URL}/api/admin-service`;

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
  return new Intl.NumberFormat("en-IN").format(number);
}

function AdminService() {
  // =========================
  // STATE
  // =========================

  const [services, setServices] = useState([]);

  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [currency, setCurrency] = useState("INR");

  const [selectedService, setSelectedService] = useState(null);

  const [editingService, setEditingService] = useState(null);

  const [showAddModal, setShowAddModal] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
      
      const token =
        localStorage.getItem("token");


      if (!token) {

        setError(
          "Authentication required. Please login again."
        );

        return;
      }

      const response = await fetch(API_URL,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to load services");
      }

      const data = await response.json();

      setServices(data);
    } catch (err) {
      console.error(err);
      setError("Unable to load services. Please check your backend.");
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
        category === "All" || item.category === category;

      const searchText = search.toLowerCase().trim();

      const searchMatch =
        item.service?.toLowerCase().includes(searchText) ||
        item.category?.toLowerCase().includes(searchText) ||
        String(item.id).includes(searchText);

      return categoryMatch && searchMatch;
    });
  }, [services, category, search]);

  // =========================
  // DELETE SERVICE
  // =========================

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this service?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete service");
      }

      // Remove service from frontend immediately
      setServices((prevServices) =>
        prevServices.filter((service) => service.id !== id)
      );

      // Close view modal if the deleted service is open
      if (selectedService?.id === id) {
        setSelectedService(null);
      }
    } catch (err) {
      console.error(err);
      setError("Unable to delete service.");
    } finally {
      setSaving(false);
    }
  };

  // =========================
  // OPEN EDIT MODAL
  // =========================

  const handleEdit = (service) => {
    setEditingService({
      ...service,
    });

    setSelectedService(null);
  };

  // =========================
  // UPDATE SERVICE
  // =========================

  const handleUpdate = async () => {
    if (!editingService) {
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response = await fetch(
        `${API_URL}/${editingService.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            category: editingService.category,
            service: editingService.service,
            rate: Number(editingService.rate),
            min_order: Number(editingService.min_order),
            max_order: Number(editingService.max_order),
            average_time: editingService.average_time,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update service");
      }

      const updatedService = await response.json();

      // Update frontend state
      setServices((prevServices) =>
        prevServices.map((service) =>
          service.id === updatedService.id
            ? updatedService
            : service
        )
      );

      setEditingService(null);
    } catch (err) {
      console.error(err);
      setError("Unable to update service.");
    } finally {
      setSaving(false);
    }
  };

  // =========================
  // ADD SERVICE
  // =========================

  const handleAdd = async (newService) => {
    try {
      setSaving(true);
      setError("");

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          category: newService.category,
          service: newService.service,
          rate: Number(newService.rate),
          min_order: Number(newService.min_order),
          max_order: Number(newService.max_order),
          average_time: newService.average_time,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add service");
      }

      const createdService = await response.json();

      setServices((prevServices) => [
        createdService,
        ...prevServices,
      ]);

      setShowAddModal(false);
    } catch (err) {
      console.error(err);
      setError("Unable to add service.");
    } finally {
      setSaving(false);
    }
  };

  // =========================
  // INPUT UPDATE HELPER
  // =========================

  const updateEditingField = (field, value) => {
    setEditingService((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="services-page">
      <AdminHome/>

      {/* =========================
          MAIN
      ========================= */}

      <main className="container">
        {/* Heading */}

        <div className="page-heading">
          <div>
            <h1>Services</h1>

            <p>
              Manage your social media services.
            </p>
          </div>

          <button
            className="add-service-btn"
            onClick={() => setShowAddModal(true)}
          >
            + Add Service
          </button>
        </div>

        {/* Error */}

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {/* Search */}

        <div className="search-box">
          <span className="search-icon">⌕</span>

          <input
            type="text"
            placeholder="Search service..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Category */}

        <div className="category-wrapper">
          {categories.map((item) => (
            <button
              key={item}
              className={
                category === item
                  ? "category-btn selected"
                  : "category-btn"
              }
              onClick={() => setCategory(item)}
            >
              {item}
            </button>
          ))}
        </div>

        {/* Service count */}

        <div className="service-toolbar">
          <div className="service-count">
            Showing{" "}
            <strong>{filteredServices.length}</strong>{" "}
            services
          </div>

          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="currency-select"
          >
            <option value="INR">INR ₹</option>
            <option value="USD">USD $</option>
            <option value="EUR">EUR €</option>
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
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredServices.map((item) => (
                  <tr key={item.id}>
                    {/* ID */}

                    <td className="service-id">
                      {item.id}
                    </td>

                    {/* Service */}

                    <td>
                      <div className="service-name">
                        {item.service}
                      </div>

                      <span className="service-category">
                        {item.category}
                      </span>
                    </td>

                    {/* Rate */}

                    <td className="rate">
                      {currencySymbols[currency]}
                      {Number(item.rate).toFixed(2)}
                    </td>

                    {/* Min */}

                    <td>
                      {formatNumber(item.min_order)}
                    </td>

                    {/* Max */}

                    <td>
                      {formatNumber(item.max_order)}
                    </td>

                    {/* Time */}

                    <td className="time">
                      {item.average_time}
                    </td>

                    {/* Actions */}

                    <td>
                      <div className="action-buttons">
                        <button
                          className="view-btn"
                          onClick={() =>
                            setSelectedService(item)
                          }
                        >
                          View
                        </button>

                        <button
                          className="edit-btn"
                          onClick={() =>
                            handleEdit(item)
                          }
                        >
                          Edit
                        </button>

                        <button
                          className="delete-btn"
                          onClick={() =>
                            handleDelete(item.id)
                          }
                          disabled={saving}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* No results */}

            {filteredServices.length === 0 && (
              <div className="no-results">
                <div className="no-results-icon">
                  🔍
                </div>

                <h3>No services found</h3>

                <p>
                  Try searching for another service or
                  category.
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
            {filteredServices.map((item) => (
              <div
                className="service-card"
                key={item.id}
              >
                <div className="card-top">
                  <div>
                    <span className="card-id">
                      ID #{item.id}
                    </span>

                    <h3>{item.service}</h3>
                  </div>

                  <span className="card-category">
                    {item.category}
                  </span>
                </div>

                <div className="card-details">
                  <div>
                    <span>Rate / 1000</span>

                    <strong>
                      {currencySymbols[currency]}
                      {Number(item.rate).toFixed(2)}
                    </strong>
                  </div>

                  <div>
                    <span>Min Order</span>

                    <strong>
                      {formatNumber(item.min_order)}
                    </strong>
                  </div>

                  <div>
                    <span>Max Order</span>

                    <strong>
                      {formatNumber(item.max_order)}
                    </strong>
                  </div>

                  <div>
                    <span>Average Time</span>

                    <strong>
                      {item.average_time}
                    </strong>
                  </div>
                </div>

                <div className="mobile-action-buttons">
                  <button
                    className="mobile-view-btn"
                    onClick={() =>
                      setSelectedService(item)
                    }
                  >
                    View
                  </button>

                  <button
                    className="edit-btn"
                    onClick={() =>
                      handleEdit(item)
                    }
                  >
                    Edit
                  </button>

                  <button
                    className="delete-btn"
                    onClick={() =>
                      handleDelete(item.id)
                    }
                    disabled={saving}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
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
              Service #{selectedService.id}
            </span>

            <h2>
              {selectedService.category}
            </h2>

            <p className="modal-service-name">
              {selectedService.service}
            </p>

            <div className="modal-details">
              <div>
                <span>Rate / 1000</span>

                <strong>
                  {currencySymbols[currency]}
                  {Number(
                    selectedService.rate
                  ).toFixed(2)}
                </strong>
              </div>

              <div>
                <span>Minimum Order</span>

                <strong>
                  {formatNumber(
                    selectedService.min_order
                  )}
                </strong>
              </div>

              <div>
                <span>Maximum Order</span>

                <strong>
                  {formatNumber(
                    selectedService.max_order
                  )}
                </strong>
              </div>

              <div>
                <span>Average Time</span>

                <strong>
                  {selectedService.average_time}
                </strong>
              </div>
            </div>

            <div className="modal-actions">
              <button
                className="edit-btn"
                onClick={() =>
                  handleEdit(selectedService)
                }
              >
                Edit Service
              </button>

              <button
                className="delete-btn"
                onClick={() =>
                  handleDelete(
                    selectedService.id
                  )
                }
              >
                Delete Service
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================
          EDIT MODAL
      ========================= */}

      {editingService && (
        <div
          className="modal-overlay"
          onClick={() =>
            setEditingService(null)
          }
        >
          <div
            className="service-modal edit-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <button
              className="close-modal"
              onClick={() =>
                setEditingService(null)
              }
            >
              ×
            </button>

            <span className="modal-id">
              Editing Service #{editingService.id}
            </span>

            <h2>Edit Service</h2>

            <div className="form-group">
              <label>Category</label>

              <input
                type="text"
                value={
                  editingService.category || ""
                }
                onChange={(e) =>
                  updateEditingField(
                    "category",
                    e.target.value
                  )
                }
              />
            </div>

            <div className="form-group">
              <label>Service Name</label>

              <textarea
                value={
                  editingService.service || ""
                }
                onChange={(e) =>
                  updateEditingField(
                    "service",
                    e.target.value
                  )
                }
                rows="3"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Rate / 1000</label>

                <input
                  type="number"
                  step="0.01"
                  value={
                    editingService.rate ?? ""
                  }
                  onChange={(e) =>
                    updateEditingField(
                      "rate",
                      e.target.value
                    )
                  }
                />
              </div>

              <div className="form-group">
                <label>Minimum Order</label>

                <input
                  type="number"
                  value={
                    editingService.min_order ?? ""
                  }
                  onChange={(e) =>
                    updateEditingField(
                      "min_order",
                      e.target.value
                    )
                  }
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Maximum Order</label>

                <input
                  type="number"
                  value={
                    editingService.max_order ?? ""
                  }
                  onChange={(e) =>
                    updateEditingField(
                      "max_order",
                      e.target.value
                    )
                  }
                />
              </div>

              <div className="form-group">
                <label>Average Time</label>

                <input
                  type="text"
                  value={
                    editingService.average_time ||
                    ""
                  }
                  onChange={(e) =>
                    updateEditingField(
                      "average_time",
                      e.target.value
                    )
                  }
                />
              </div>
            </div>

            <div className="modal-actions">
              <button
                className="cancel-btn"
                onClick={() =>
                  setEditingService(null)
                }
              >
                Cancel
              </button>

              <button
                className="save-btn"
                onClick={handleUpdate}
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================
          ADD MODAL
      ========================= */}

      {showAddModal && (
        <AddServiceModal
          onClose={() =>
            setShowAddModal(false)
          }
          onAdd={handleAdd}
          saving={saving}
        />
      )}
    </div>
  );
}

// =====================================================
// ADD SERVICE MODAL
// =====================================================

function AddServiceModal({
  onClose,
  onAdd,
  saving,
}) {
  const [form, setForm] = useState({
    category: "",
    service: "",
    rate: "",
    min_order: "",
    max_order: "",
    average_time: "",
  });

  const handleChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = () => {
    if (
      !form.category ||
      !form.service ||
      !form.rate ||
      !form.min_order ||
      !form.max_order ||
      !form.average_time
    ) {
      alert("Please fill all fields.");
      return;
    }

    onAdd(form);
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
    >
      <div
        className="service-modal edit-modal"
        onClick={(e) =>
          e.stopPropagation()
        }
      >
        <button
          className="close-modal"
          onClick={onClose}
        >
          ×
        </button>

        <h2>Add New Service</h2>

        <div className="form-group">
          <label>Category</label>

          <input
            type="text"
            placeholder="Instagram Views"
            value={form.category}
            onChange={(e) =>
              handleChange(
                "category",
                e.target.value
              )
            }
          />
        </div>

        <div className="form-group">
          <label>Service Name</label>

          <textarea
            rows="3"
            placeholder="Instagram Views [Instant]"
            value={form.service}
            onChange={(e) =>
              handleChange(
                "service",
                e.target.value
              )
            }
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Rate / 1000</label>

            <input
              type="number"
              step="0.01"
              placeholder="0.16"
              value={form.rate}
              onChange={(e) =>
                handleChange(
                  "rate",
                  e.target.value
                )
              }
            />
          </div>

          <div className="form-group">
            <label>Minimum Order</label>

            <input
              type="number"
              placeholder="100"
              value={form.min_order}
              onChange={(e) =>
                handleChange(
                  "min_order",
                  e.target.value
                )
              }
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Maximum Order</label>

            <input
              type="number"
              placeholder="1000000"
              value={form.max_order}
              onChange={(e) =>
                handleChange(
                  "max_order",
                  e.target.value
                )
              }
            />
          </div>

          <div className="form-group">
            <label>Average Time</label>

            <input
              type="text"
              placeholder="30 minutes"
              value={form.average_time}
              onChange={(e) =>
                handleChange(
                  "average_time",
                  e.target.value
                )
              }
            />
          </div>
        </div>

        <div className="modal-actions">
          <button
            className="cancel-btn"
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            className="save-btn"
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving
              ? "Adding..."
              : "Add Service"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminService;
