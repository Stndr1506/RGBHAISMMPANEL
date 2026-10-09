import { useCallback, useEffect, useState } from "react";
import "../styles/Announcement.css";

const API_URL = process.env.REACT_APP_API_URL;

const Announcement = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =====================================================
  // FETCH ANNOUNCEMENTS
  // =====================================================

  const fetchAnnouncements = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/api/announcements`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to fetch announcements"
        );
      }

      setAnnouncements(data.announcements || []);
    } catch (err) {
      console.error("Announcement error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  },[]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

//   // =====================================================
//   // WHATSAPP SHARE
//   // =====================================================

//   const shareOnWhatsApp = (announcement) => {
//   const message = `*${announcement.title}*

// ${announcement.message}

// *Service ID:* ${announcement.service_id ?? "N/A"}
// *Service Name:* ${announcement.service || "All Services"}

// *RGBHAI SMM PANEL*`;

//   const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;

//   window.open(whatsappUrl, "_blank", "noopener,noreferrer");
// };
  // =====================================================
  // TYPE ICON
  // =====================================================

  const getTypeIcon = (type) => {
    switch (type) {
      case "PRICE_CHANGE":
        return "💰";

      case "SERVICE_DISCONTINUED":
        return "⚠️";

      case "SERVICE_UPDATE":
        return "🔄";

      case "MAINTENANCE":
        return "🔧";

      case "IMPORTANT":
        return "🚨";

      default:
        return "📢";
    }
  };

  // =====================================================
  // TYPE NAME
  // =====================================================

  const getTypeName = (type) => {
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
  // DATE FORMAT
  // =====================================================

  const formatDate = (date) => {
    if (!date) return "";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="user-announcement-page">

      {/* ================================
          HEADER
      ================================= */}

      <div className="user-announcement-header">

        <div className="announcement-heading">

          <div className="announcement-heading-icon">
            📢
          </div>

          <div>
            <h2>Announcements</h2>

            <p>
              Stay updated with the latest news,
              service updates and important changes.
            </p>
          </div>

        </div>

        <button
          className="refresh-announcement-btn"
          onClick={fetchAnnouncements}
          disabled={loading}
        >
          ↻ Refresh
        </button>

      </div>

      {/* ================================
          ERROR
      ================================= */}

      {error && (
        <div className="user-announcement-error">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* ================================
          LOADING
      ================================= */}

      {loading ? (
        <div className="announcement-loading-box">

          <div className="announcement-spinner"></div>

          <p>Loading announcements...</p>

        </div>
      ) : announcements.length === 0 ? (

        /* ================================
           EMPTY
        ================================= */

        <div className="no-announcements">

          <div className="no-announcement-icon">
            📢
          </div>

          <h3>No announcements</h3>

          <p>
            There are no new announcements at the moment.
          </p>

        </div>

      ) : (

        /* ================================
           ANNOUNCEMENT LIST
        ================================= */

        <div className="announcement-list">

          {announcements.map((announcement) => (

            <div
              className="user-announcement-card"
              key={announcement.id}
            >

              {/* CARD TOP */}

              <div className="announcement-card-top">

                <div className="announcement-icon">
                  {getTypeIcon(announcement.type)}
                </div>

                <div className="announcement-card-heading">

                  <h3>
                    {announcement.title}
                  </h3>

                  <div className="announcement-meta">

                    <span
                      className={`announcement-badge ${announcement.type?.toLowerCase()}`}
                    >
                      {getTypeName(announcement.type)}
                    </span>

                    <span className="announcement-date">
                      {formatDate(
                        announcement.created_at
                      )}
                    </span>

                  </div>

                </div>

              </div>

              {/* MESSAGE */}

              <div className="announcement-card-message">
                {announcement.message}
              </div>

              {/* SERVICE */}

              {announcement.service && (
                <div className="announcement-service">

                  <span className="service-label">
                    Service
                  </span>

                  <span className="service-name">
                    {announcement.service}
                  </span>

                </div>
              )}

              {/* CARD FOOTER */}

              <div className="announcement-card-footer">

                {/* <button
                  className="whatsapp-share-btn"
                  onClick={() =>
                    shareOnWhatsApp(announcement)
                  }
                >
                  <span>💬</span>
                  Share on WhatsApp
                </button> */}

              </div>

            </div>

          ))}

        </div>

      )}

    </div>
  );
};

export default Announcement;