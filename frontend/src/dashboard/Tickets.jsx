import React, { useState } from "react";
import "../styles/Tickets.css";
import WhatsAppButton from "../components/WhatsappButton";

function Tickets() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [file, setFile] = useState(null);

  // Temporary ticket data
  // Later we can replace this with API data from SQL Server
  const [tickets] = useState([
    // {
    //   id: 1001,
    //   subject: "Payment issue",
    //   status: "Pending",
    //   lastUpdate: "25 Sep 2026",
    // },
    // {
    //   id: 1002,
    //   subject: "Order not completed",
    //   status: "Answered",
    //   lastUpdate: "24 Sep 2026",
    // },
  ]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!subject || !message) {
      alert("Please fill subject and message.");
      return;
    }

    console.log({
      subject,
      message,
      file,
    });

    alert("Ticket submitted successfully.");

    setSubject("");
    setMessage("");
    setFile(null);
  };

  const filteredTickets = tickets.filter((ticket) =>
    ticket.subject.toLowerCase().includes(search.toLowerCase()) ||
    String(ticket.id).includes(search)
  );

  return (
    <div className="tickets-page">

      {/* =========================
          NAVBAR
      ========================= */}

      <header className="tickets-navbar">

        <div className="tickets-logo">
          {/* <div className="logo-circle">
            <span></span>
          </div> */}

          <div className="logo-text">
            <strong></strong>
            <span></span>
          </div>
        </div>

        <button className="tickets-menu-btn">
          {/* <span></span>
          <span></span>
          <span></span> */}
        </button>

      </header>


      {/* =========================
          MAIN CONTENT
      ========================= */}

      <main className="tickets-container">

        {/* =========================
            CREATE TICKET
        ========================= */}

        <section className="ticket-form-card">

          <div className="ticket-form-header">
            <h1>Create Ticket</h1>
            <p>
              Contact our support team if you need any help.
            </p>
          </div>

          <form onSubmit={handleSubmit}>

            {/* Subject */}

            <div className="ticket-form-group">

              <label htmlFor="subject">
                Subject
              </label>

              <input
                id="subject"
                type="text"
                placeholder="Enter ticket subject"
                value={subject}
                onChange={(e) =>
                  setSubject(e.target.value)
                }
              />

            </div>


            {/* Message */}

            <div className="ticket-form-group">

              <label htmlFor="message">
                Message
              </label>

              <textarea
                id="message"
                placeholder="Describe your issue..."
                value={message}
                onChange={(e) =>
                  setMessage(e.target.value)
                }
              />

            </div>


            {/* Attachment */}

            <div className="ticket-attachment">

              <label htmlFor="ticket-file">

                <span className="attachment-icon">
                  📎
                </span>

                <span>
                  {file
                    ? file.name
                    : "Attach files"}
                </span>

              </label>

              <input
                id="ticket-file"
                type="file"
                onChange={(e) =>
                  setFile(e.target.files[0])
                }
              />

            </div>


            {/* Submit */}

            <button
              type="submit"
              className="submit-ticket-btn"
            >
              Submit ticket
            </button>

          </form>

        </section>


        {/* =========================
            SEARCH
        ========================= */}

        <section className="ticket-search-card">

          <div className="ticket-search">

            <input
              type="text"
              placeholder="Search"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />

            <button type="button">
              🔍
            </button>

          </div>

        </section>


        {/* =========================
            TICKET TABLE
        ========================= */}

        <section className="tickets-table-card">

          <div className="tickets-table-wrapper">

            <table className="tickets-table">

              <thead>

                <tr>
                  <th>ID</th>
                  <th>Subject</th>
                  <th>Status</th>
                  <th>Last update</th>
                </tr>

              </thead>

              <tbody>

                {filteredTickets.length > 0 ? (

                  filteredTickets.map((ticket) => (

                    <tr key={ticket.id}>

                      <td data-label="ID">
                        #{ticket.id}
                      </td>

                      <td data-label="Subject">
                        {ticket.subject}
                      </td>

                      <td data-label="Status">

                        <span
                          className={`ticket-status ${ticket.status
                            .toLowerCase()
                            .replace(" ", "-")}`}
                        >
                          {ticket.status}
                        </span>

                      </td>

                      <td data-label="Last update">
                        {ticket.lastUpdate}
                      </td>

                    </tr>

                  ))

                ) : (

                  <tr>

                    <td
                      colSpan="4"
                      className="no-tickets"
                    >
                      No tickets found
                    </td>

                  </tr>

                )}

              </tbody>

            </table>

          </div>

        </section>

      </main>
      <WhatsAppButton/>

    </div>
  );
}

export default Tickets;