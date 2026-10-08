import React, { useEffect, useState } from "react";
import "../styles/AdminAnnouncement.css";

// const API_URL = process.env.REACT_APP_API_URL;

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

  // =====================================================
  // GET TOKEN
  // =====================================================

  const getToken = () => {
    return localStorage.getItem("token");
  };

  const fetchServices = async () => {
  try {
    const response = await fetch(
      "http://localhost:5000/api/dashboard-service"
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch services");
    }

    console.log("Services API response:", data);

    setServices(data.services || []);
  } catch (err) {
    console.error("Fetch services error:", err);
  }
};
  // =====================================================
  // FETCH ANNOUNCEMENTS
  // =====================================================

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      setError("");

      const token = getToken();

      const response = await fetch(
        `http://localhost:5000/api/admin/announcements`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to fetch announcements"
        );
      }

      setAnnouncements(data.announcements || []);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
    fetchServices();
  }, []);

  // =====================================================
  // WHATSAPP SHARE
  // =====================================================

const shareOnWhatsApp = (announcement) => {

  // Find selected service from services list
  const selectedService = services.find(
    (service) =>
      Number(service.id) === Number(announcement.service_id)
  );

  const serviceName = selectedService
    ? selectedService.service
    : announcement.service_id
    ? "Service not found"
    : "All Services";

  const message = `*${announcement.title}*

${announcement.message}

*Service ID:* ${
    announcement.service_id ?? "N/A"
  }
*Service Name:* ${serviceName}

*RGBHAI SMM PANEL*`;

  const whatsappUrl =
    `https://wa.me/?text=${encodeURIComponent(message)}`;

  window.open(
    whatsappUrl,
    "_blank",
    "noopener,noreferrer"
  );
};

  // =====================================================
  // INPUT CHANGE
  // =====================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =====================================================
  // OPEN ADD MODAL
  // =====================================================

  const handleAdd = () => {
    setEditingId(null);

    setFormData({
      title: "",
      type: "GENERAL",
      message: "",
      service_id: "",
      status: "published",
    });

    setShowModal(true);
  };

  // =====================================================
  // OPEN EDIT MODAL
  // =====================================================

  const handleEdit = (announcement) => {
    setEditingId(announcement.id);

    setFormData({
      title: announcement.title || "",
      type: announcement.type || "GENERAL",
      message: announcement.message || "",
      service_id: announcement.service_id || "",
      status: announcement.status || "published",
    });

    setShowModal(true);
  };

  // =====================================================
  // SAVE ANNOUNCEMENT
  // =====================================================

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

      const token = getToken();

      const url = editingId
        ? `http://localhost:5000/api/admin/announcements/${editingId}` //${API_URL}
        : `http://localhost:5000/api/admin/announcements`;

      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
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
        throw new Error(
          data.message || "Failed to save announcement"
        );
      }

      alert(
        editingId
          ? "Announcement updated successfully"
          : "Announcement created successfully"
      );

      setShowModal(false);

      fetchAnnouncements();
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // DELETE
  // =====================================================

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this announcement?"
    );

    if (!confirmDelete) return;

    try {
      const token = getToken();

      const response = await fetch(
        `http://localhost:5000/api/admin/announcements/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to delete announcement"
        );
      }

      alert("Announcement deleted successfully");

      fetchAnnouncements();
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  // =====================================================
  // TYPE LABEL
  // =====================================================

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

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="admin-announcement-page">

      {/* HEADER */}

      <div className="announcement-header">
        <div>
          <h2>Announcements</h2>
          <p>
            Create and manage announcements for your users.
          </p>
        </div>

        <button
          className="add-announcement-btn"
          onClick={handleAdd}
        >
          + Add Announcement
        </button>
      </div>

      {/* ERROR */}

      {error && (
        <div className="announcement-error">
          {error}
        </div>
      )}

      {/* LOADING */}

      {loading ? (
        <div className="announcement-loading">
          Loading announcements...
        </div>
      ) : announcements.length === 0 ? (
        <div className="announcement-empty">
          <div className="empty-icon">📢</div>

          <h3>No announcements yet</h3>

          <p>
            Create your first announcement for users.
          </p>

          <button onClick={handleAdd}>
            Create Announcement
          </button>
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

                  <td>
                    #{announcement.id}
                  </td>

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
                      <span className="no-service">
                        All Services
                      </span>
                    )}
                  </td>

                  <td>
                    <span
                      className={`announcement-status ${
                        announcement.status
                      }`}
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

                    
                    {/* share on whatsapp */}
                      <button
                        className="whatsapp-share-btn"
                        onClick={() =>
                          shareOnWhatsApp(announcement)
                        }
                      >
                        <span>💬</span>
                        Share on WhatsApp
                      </button>
                      
                      <button
                        className="edit-btn"
                        onClick={() =>
                          handleEdit(announcement)
                        }
                      >
                        Edit
                      </button>

                      <button
                        className="delete-btn"
                        onClick={() =>
                          handleDelete(announcement.id)
                        }
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

      {/* =================================================
          MODAL
      ================================================= */}

      {showModal && (
        <div
          className="announcement-modal-overlay"
          onClick={() => setShowModal(false)}
        >

          <div
            className="announcement-modal"
            onClick={(e) => e.stopPropagation()}
          >

            <div className="modal-header">

              <div>
                <h3>
                  {editingId
                    ? "Edit Announcement"
                    : "Create Announcement"}
                </h3>

                <p>
                  This announcement will be shown to users.
                </p>
              </div>

              <button
                className="modal-close"
                onClick={() => setShowModal(false)}
              >
                ×
              </button>

            </div>

            <form onSubmit={handleSubmit}>

              {/* TITLE */}

              <div className="form-group">

                <label>
                  Title
                </label>

                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Enter announcement title"
                />

              </div>

              {/* TYPE */}

              <div className="form-group">

                <label>
                  Announcement Type
                </label>

                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                >

                  <option value="GENERAL">
                    General
                  </option>

                  <option value="PRICE_CHANGE">
                    Price Change
                  </option>

                  <option value="SERVICE_UPDATE">
                    Service Update
                  </option>

                  <option value="SERVICE_DISCONTINUED">
                    Service Discontinued
                  </option>

                  <option value="MAINTENANCE">
                    Maintenance
                  </option>

                  <option value="IMPORTANT">
                    Important
                  </option>

                </select>

              </div>

              {/* SERVICE */}

              <div className="form-group">

                <label>
                  Service ID
                  <span className="optional">
                    Optional
                  </span>
                </label>

                <select
                name="service_id"
                value={formData.service_id}
                onChange={handleChange}
                >
                <option value="">
                    Please select service
                </option>

                {services.map((service) => (
                    <option
                    key={service.id}
                    value={service.id}
                    >
                    #{service.id} - {service.service}
                    </option>
                ))}
                </select>

                <small>
                  Leave empty if announcement applies
                  to all services.
                </small>

              </div>

              {/* MESSAGE */}

              <div className="form-group">

                <label>
                  Message
                </label>

                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Write your announcement..."
                  rows="5"
                />

              </div>

              {/* STATUS */}

              <div className="form-group">

                <label>
                  Status
                </label>

                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                >

                  <option value="published">
                    Published
                  </option>

                  <option value="draft">
                    Draft
                  </option>

                </select>

              </div>

              {/* BUTTONS */}

              <div className="modal-buttons">

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
  );
};

export default AdminAnnouncement;