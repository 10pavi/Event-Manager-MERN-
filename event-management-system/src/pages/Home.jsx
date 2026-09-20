
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function Home() {
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalParticipants: 0,
    totalOrganizers: 0,
    totalCategories: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        // Fetch events and homepage statistics together
        const [eventsResponse, statsResponse] =
          await Promise.all([
            fetch("http://localhost:5000/api/events"),
            fetch("http://localhost:5000/api/events/stats"),
          ]);

        const eventsData = await eventsResponse.json();
        const statsData = await statsResponse.json();

        if (!eventsResponse.ok) {
          throw new Error(
            eventsData.message || "Failed to load events."
          );
        }

        if (!statsResponse.ok) {
          throw new Error(
            statsData.message ||
              "Failed to load homepage statistics."
          );
        }

        setEvents(
          Array.isArray(eventsData) ? eventsData : []
        );

        setStats(statsData);
      } catch (err) {
        console.error("Home page error:", err);

        setError(
          "Could not load homepage data. Please check if the backend is running and the API is working."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  // Show only upcoming events
  const upcomingEvents = events
    .filter(
      (event) =>
        new Date(event.date) >=
        new Date(new Date().toDateString())
    )
    .sort(
      (a, b) =>
        new Date(a.date) - new Date(b.date)
    )
    .slice(0, 3);

  return (
    <main>
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <p className="hero-tag">
            DISCOVER • CONNECT • PARTICIPATE
          </p>

          <h1>
            Find Events That
            <span> Inspire You</span>
          </h1>

          <p className="hero-description">
            Discover exciting events, workshops, hackathons
            and activities happening around you.
            Register and never miss an opportunity.
          </p>

          <div className="hero-buttons">
            <Link to="/events" className="primary-btn">
              Explore Events →
            </Link>

            <Link to="/register" className="secondary-btn">
              Create Account
            </Link>
          </div>
        </div>
      </section>

      {/* Dynamic Statistics */}
      <section className="stats">
        <div className="stat">
          <h2>
            {loading ? "..." : stats.totalEvents}
          </h2>
          <p>Events</p>
        </div>

        <div className="stat">
          <h2>
            {loading ? "..." : stats.totalParticipants}
          </h2>
          <p>Participants</p>
        </div>

        <div className="stat">
          <h2>
            {loading ? "..." : stats.totalOrganizers}
          </h2>
          <p>Organizers</p>
        </div>

        <div className="stat">
          <h2>
            {loading ? "..." : stats.totalCategories}
          </h2>
          <p>Categories</p>
        </div>
      </section>

      {/* Upcoming Events */}
      <section className="upcoming">
        <div className="section-heading">
          <div>
            <p className="section-tag">
              DON'T MISS OUT
            </p>

            <h2>Upcoming Events</h2>
          </div>

          <Link to="/events" className="view-all">
            View All →
          </Link>
        </div>

        {loading && (
          <p className="events-message">
            Loading events...
          </p>
        )}

        {error && (
          <p className="events-message error-message">
            {error}
          </p>
        )}

        {!loading &&
          !error &&
          upcomingEvents.length === 0 && (
            <div className="no-events">
              <h3>No upcoming events yet</h3>
              <p>
                Check back soon! New events will appear
                here when the admin adds them.
              </p>
            </div>
          )}

        {!loading &&
          !error &&
          upcomingEvents.length > 0 && (
            <div className="event-grid">
              {upcomingEvents.map((event) => (
                <div
                  className="home-event-card"
                  key={event._id}
                >
                  <div className="event-image">
                    <span>{event.category}</span>
                  </div>

                  <div className="event-info">
                    <p className="event-date">
                      {new Date(
                        event.date
                      ).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>

                    <h3>{event.title}</h3>

                    <p className="event-location">
                      📍 {event.location}
                    </p>

                    <Link to={`/events/${event._id}`}>
                      View Details →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
      </section>
    </main>
  );
}

export default Home;