
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function MyEvents() {
  const [registeredEvents, setRegisteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelingId, setCancelingId] = useState("");

  const getToken = () =>
    localStorage.getItem("token") ||
    sessionStorage.getItem("token");

  const fetchMyEvents = async () => {
    const token = getToken();

    if (!token) {
      setError("Please log in to view your registered events.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "http://localhost:5000/api/events/my/registrations",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not load registrations.");
      }

      setRegisteredEvents(
        data
          .filter((registration) => registration.event)
          .map((registration) => {
            const event = registration.event;

            return {
              ...event,
              id: event._id,
              registrationId: registration._id,
              date: event.date
                ? new Date(event.date).toLocaleDateString(
                    "en-GB",
                    {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    }
                  )
                : "Date not available",
              status: "Registered",
            };
          })
      );
    } catch (err) {
      setError(
        err.message === "Failed to fetch"
          ? "Cannot connect to the server. Make sure the backend is running."
          : err.message
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyEvents();
  }, []);

  const handleCancel = async (eventId) => {
    const token = getToken();

    if (!token) {
      setError("Please log in again.");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to cancel this registration?"
    );

    if (!confirmed) return;

    try {
      setCancelingId(eventId);
      setError("");

      const response = await fetch(
        `http://localhost:5000/api/events/${eventId}/register`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not cancel registration.");
      }

      setRegisteredEvents((previous) =>
        previous.filter((event) => event.id !== eventId)
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setCancelingId("");
    }
  };

  return (
    <main className="my-events-page">
      <section className="my-events-header">
        <p className="section-tag">YOUR ACTIVITIES</p>
        <h1>My Events</h1>
        <p>
          View the events you have registered for and keep track
          of your upcoming activities.
        </p>
      </section>

      {error && (
        <p role="alert" style={{ color: "red" }}>
          {error}
        </p>
      )}

      <section className="my-events-stats">
        <div className="my-event-stat">
          <span className="my-stat-icon">📅</span>
          <div>
            <h2>{registeredEvents.length}</h2>
            <p>Registered Events</p>
          </div>
        </div>

        <div className="my-event-stat">
          <span className="my-stat-icon">🎯</span>
          <div>
            <h2>{registeredEvents.length}</h2>
            <p>Upcoming</p>
          </div>
        </div>
      </section>

      <section className="registered-events">
        <div className="results-heading">
          <h2>Registered Events</h2>
          <span>
            {registeredEvents.length} event
            {registeredEvents.length !== 1 ? "s" : ""}
          </span>
        </div>

        {loading ? (
          <p>Loading your registrations...</p>
        ) : registeredEvents.length > 0 ? (
          <div className="my-events-grid">
            {registeredEvents.map((event) => (
              <div className="my-event-card" key={event.id}>
                <div className="my-event-image">
                  <span className="my-event-category">
                    {event.category}
                  </span>
                  <span className="registered-badge">
                    ✓ Registered
                  </span>
                </div>

                <div className="my-event-content">
                  <p className="my-event-date">{event.date}</p>
                  <h3>{event.title}</h3>

                  <div className="my-event-info">
                    <p>⏰ {event.time}</p>
                    <p>📍 {event.location}</p>
                  </div>

                  <div className="my-event-actions">
                    <Link
                      to={`/events/${event.id}`}
                      className="primary-btn"
                    >
                      View Details
                    </Link>

                    <button
                      className="cancel-event-btn"
                      onClick={() => handleCancel(event.id)}
                      disabled={cancelingId === event.id}
                    >
                      {cancelingId === event.id
                        ? "Cancelling..."
                        : "Cancel"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-registered-events">
            <div className="empty-icon">📅</div>
            <h3>No Registered Events</h3>
            <p>
              You haven't registered for any events yet.
              Explore upcoming events and find something interesting.
            </p>
            <Link to="/events" className="primary-btn">
              Explore Events →
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}

export default MyEvents;