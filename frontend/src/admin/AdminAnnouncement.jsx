import React, { useCallback, useEffect, useState } from "react";
import "../styles/AdminAnnouncement.css";
import AdminNavbar from "../components/AdminNavbar";

const API_URL = process.env.REACT_APP_API_URL;

const AdminAnnouncement = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [services, setServices] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    type: "GENERAL",
    message: "",
    service_id: "",
    status: "published",
  });

  const [error, setError] = useState("");
  const [serviceSearch, setServiceSearch] = useState("");

  const getToken = () => localStorage.getItem("token");

  // Fetch services for the searchable service selector.
  const fetchServices = async () => {
    try {
      const response = await fetch(`${API_URL}/api/dashboard-service`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch services");
      }

      setServices(Array.isArray(data.services) ? data.services : []);
    } catch (err) {
      console.error("Fetch services error:", err);
      setServices([]);
    }
  };

  // Fetch announcements.
  const fetchAnnouncements = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/api/admin/announcements`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch announcements");
      }

      setAnnouncements(data.announcements || []);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnnouncements();
    fetchServices();
  }, [fetchAnnouncements]);

  // Share announcement on WhatsApp.
  const shareOnWhatsApp = (announcement) => {
    const selectedService = services.find(
      (service) => Number(service.id) === Number(announcement.service_id)
    );

    const serviceName = selectedService
      ? selectedService.service
      : announcement.service_id
      ? "Service not found"
      : "All Services";

    const websiteLink = "https://rgbhaimedia.com";

    const message = `📢 *${announcement.title}*

${announcement.message}

*Service ID:* ${announcement.service_id ?? "N/A"}
*Service Name:* ${serviceName}

🌐 *RG Bhai smm service provider:*
${websiteLink}

🚀 Grow your social media with RGBHAI!`;

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const closeModal = () => {
    setShowModal(false);
    setServiceSearch("");
  };

  const handleAdd = () => {
    setEditingId(null);
    setServiceSearch("");
    setFormData({
      title: "",
      type: "GENERAL",
      message: "",
      service_id: "",
      status: "published",
    });
    setShowModal(true);
  };

  const handleEdit = (announcement) => {
    setEditingId(announcement.id);
    setServiceSearch("");
    setFormData({
      title: announcement.title || "",
      type: announcement.type || "GENERAL",
      message: announcement.message || "",
      service_id:
        announcement.service_id !== null &&
        announcement.service_id !== undefined
          ? String(announcement.service_id)
          : "",
      status: announcement.status || "published",
    });
    setShowModal(true);
  };

  // Create or update announcement.
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      alert("Please enter announcement title");
      return;
    }

    if (!formData.message.trim()) {
      alert("Please enter announcement message");
      return;
    }

    try {
      setSaving(true);

      const url = editingId
        ? `${API_URL}/api/admin/announcements/${editingId}`
        : `${API_URL}/api/admin/announcements`;

      const response = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          title: formData.title,
          type: formData.type,
          message: formData.message,
          service_id: formData.service_id
            ? Number(formData.service_id)
            : null,
          status: formData.status,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to save announcement");
      }

      alert(
        editingId
          ? "Announcement updated successfully"
          : "Announcement created successfully"
      );

      closeModal();
      fetchAnnouncements();
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Delete announcement.
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this announcement?"
    );

    if (!confirmDelete) return;

    try {
      const response = await fetch(
        `${API_URL}/api/admin/announcements/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete announcement");
      }

      alert("Announcement deleted successfully");
      fetchAnnouncements();
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case "PRICE_CHANGE":
        return "Price Change";
      case "SERVICE_DISCONTINUED":
        return "Service Discontinued";
      case "SERVICE_UPDATE":
        return "Service Update";
      case "MAINTENANCE":
        return "Maintenance";
      case "IMPORTANT":
        return "Important";
      default:
        return "General";
    }
  };

  // Search service by its ID or service name.
  const filteredServices = services.filter((service) => {
    const search = serviceSearch.trim().toLowerCase();
    if (!search) return true;

    return (
      String(service.id ?? "").toLowerCase().includes(search) ||
      String(service.service ?? "").toLowerCase().includes(search)
    );
  });

  return (
    <>
      <AdminNavbar />

      <div className="admin-announcement-page">
        <div className="announcement-header">
          <div>
            <h2>Announcements</h2>
            <p>Create and manage announcements for your users.</p>
          </div>

          <button
            className="add-announcement-btn"
            onClick={handleAdd}
          >
            + Add Announcement
          </button>
        </div>

        {error && <div className="announcement-error">{error}</div>}

        {loading ? (
          <div className="announcement-loading">
            Loading announcements...
          </div>
        ) : announcements.length === 0 ? (
          <div className="announcement-empty">
            <div className="empty-icon">📢</div>
            <h3>No announcements yet</h3>
            <p>Create your first announcement for users.</p>
            <button onClick={handleAdd}>Create Announcement</button>
          </div>
        ) : (
          <div className="announcement-table-wrapper">
            <table className="announcement-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Announcement</th>
                  <th>Type</th>
                  <th>Service</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {announcements.map((announcement) => (
                  <tr key={announcement.id}>
                    <td>#{announcement.id}</td>
                    <td>
                      <div className="announcement-title">
                        {announcement.title}
                      </div>
                      <div className="announcement-message">
                        {announcement.message}
                      </div>
                    </td>
                    <td>
                      <span
                        className={`announcement-type ${announcement.type?.toLowerCase()}`}
                      >
                        {getTypeLabel(announcement.type)}
                      </span>
                    </td>
                    <td>
                      {announcement.service || (
                        <span className="no-service">All Services</span>
                      )}
                    </td>
                    <td>
                      <span
                        className={`announcement-status ${announcement.status}`}
                      >
                        {announcement.status}
                      </span>
                    </td>
                    <td>
                      {announcement.created_at
                        ? new Date(
                            announcement.created_at
                          ).toLocaleDateString()
                        : "-"}
                    </td>
                    <td>
                      <div className="announcement-actions">
                        <button
                          className="whatsapp-share-btn"
                          onClick={() => shareOnWhatsApp(announcement)}
                        >
                          <span>💬</span>
                          Share on WhatsApp
                        </button>

                        <button
                          className="edit-btn"
                          onClick={() => handleEdit(announcement)}
                        >
                          Edit
                        </button>

                        <button
                          className="delete-btn"
                          onClick={() => handleDelete(announcement.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {showModal && (
          <div
            className="announcement-modal-overlay"
            onClick={closeModal}
          >
            <div
              className="announcement-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <div>
                  <h3>
                    {editingId ? "Edit Announcement" : "Create Announcement"}
                  </h3>
                  <p>This announcement will be shown to users.</p>
                </div>

                <button
                  type="button"
                  className="modal-close"
                  onClick={closeModal}
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Title</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Enter announcement title"
                  />
                </div>

                <div className="form-group">
                  <label>Announcement Type</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                  >
                    <option value="GENERAL">General</option>
                    <option value="PRICE_CHANGE">Price Change</option>
                    <option value="SERVICE_UPDATE">Service Update</option>
                    <option value="SERVICE_DISCONTINUED">
                      Service Discontinued
                    </option>
                    <option value="MAINTENANCE">Maintenance</option>
                    <option value="IMPORTANT">Important</option>
                  </select>
                </div>

                {/* SEARCHABLE SERVICE SELECTOR */}
                <div className="form-group">
                  <label>
                    Select Service <span className="optional">Optional</span>
                  </label>

                  <input
                    type="text"
                    value={serviceSearch}
                    onChange={(e) => setServiceSearch(e.target.value)}
                    placeholder="Search service by ID or name..."
                    autoComplete="off"
                  />

                  <select
                    name="service_id"
                    value={formData.service_id}
                    onChange={handleChange}
                  >
                    <option value="">All Services</option>

                    {filteredServices.map((service) => (
                      <option
                        key={service.id}
                        value={String(service.id)}
                      >
                        #{service.id} - {service.service}
                      </option>
                    ))}
                  </select>

                  <small>
                    Search by service ID or name, then select a service.
                    Leave empty if the announcement applies to all services.
                  </small>

                  {serviceSearch.trim() && filteredServices.length === 0 && (
                    <small>No services found for "{serviceSearch}".</small>
                  )}
                </div>

                <div className="form-group">
                  <label>Message</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Write your announcement..."
                    rows="5"
                  />
                </div>

                <div className="form-group">
                  <label>Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>

                <div className="modal-buttons">
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={closeModal}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="save-btn"
                    disabled={saving}
                  >
                    {saving
                      ? "Saving..."
                      : editingId
                      ? "Update Announcement"
                      : "Publish Announcement"}
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

export default AdminAnnouncement;