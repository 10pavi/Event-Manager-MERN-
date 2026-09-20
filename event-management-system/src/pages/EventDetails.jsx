
import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";

function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [registering, setRegistering] = useState(false);

  // Fetch the selected event
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `http://localhost:5000/api/events/${id}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Event not found.");
        }

        setEvent(data);
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

    fetchEvent();
  }, [id]);

  // Get token from either storage
  const getToken = () =>
    localStorage.getItem("token") ||
    sessionStorage.getItem("token");

  // Register for the event
  const handleRegister = async () => {
    const token = getToken();

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setRegistering(true);
      setMessage("");

      const response = await fetch(
        `http://localhost:5000/api/events/${id}/register`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed.");
      }

      // Update participant count after successful registration
      setEvent((previousEvent) => ({
        ...previousEvent,
        participantCount:
          Number(previousEvent.participantCount || 0) + 1,
      }));

      setMessage("Successfully registered for this event!");
    } catch (err) {
      setMessage(err.message);
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <main className="event-details-page">
        <p>Loading event...</p>
      </main>
    );
  }

  if (error || !event) {
    return (
      <main className="event-details-page">
        <div className="event-not-found">
          <h1>Event Not Found</h1>
          <p>{error || "The event does not exist."}</p>
          <Link to="/events" className="primary-btn">
            ← Back to Events
          </Link>
        </div>
      </main>
    );
  }

  const formattedDate = event.date
    ? new Date(event.date).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "Date not available";

  const capacity = Number(event.capacity) || 0;
  const participants = Number(event.participantCount) || 0;
  const seatsAvailable = Math.max(capacity - participants, 0);
  const isFull = capacity > 0 && participants >= capacity;

  return (
    <main className="event-details-page">
      <Link to="/events" className="back-link">
        ← Back to Events
      </Link>

      <section className="event-details-card">
        <div className="event-details-image">
          <span>{event.category}</span>
        </div>

        <div className="event-details-content">
          <div className="event-details-header">
            <div>
              <p className="event-details-category">
                {event.category}
              </p>
              <h1>{event.title}</h1>
            </div>
          </div>

          <p className="event-details-description">
            {event.description}
          </p>

          <div className="event-meta">
            <div className="event-meta-item">
              <span className="meta-icon">📅</span>
              <div>
                <small>Date</small>
                <strong>{formattedDate}</strong>
              </div>
            </div>

            <div className="event-meta-item">
              <span className="meta-icon">⏰</span>
              <div>
                <small>Time</small>
                <strong>{event.time || "Time not available"}</strong>
              </div>
            </div>

            <div className="event-meta-item">
              <span className="meta-icon">📍</span>
              <div>
                <small>Venue</small>
                <strong>{event.location}</strong>
              </div>
            </div>

            <div className="event-meta-item">
              <span className="meta-icon">👥</span>
              <div>
                <small>Capacity</small>
                <strong>{capacity} Participants</strong>
                <small className="participant-count">
                  {participants} registered
                </small>
                <small
                  className={`seats-available ${
                    isFull ? "event-full" : ""
                  }`}
                >
                  {isFull
                    ? "Event Full"
                    : `${seatsAvailable} seats available`}
                </small>
              </div>
            </div>
          </div>

          <div className="event-details-actions">
            <button
              className="primary-btn"
              onClick={handleRegister}
              disabled={registering || isFull}
            >
              {registering
                ? "Registering..."
                : isFull
                ? "Event Full"
                : "Register for Event"}
            </button>

            <Link to="/events" className="secondary-btn">
              Browse More Events
            </Link>
          </div>

          {message && (
            <p role="status" style={{ marginTop: "15px" }}>
              {message}
            </p>
          )}
        </div>
      </section>
    </main>
  );
}

export default EventDetails;