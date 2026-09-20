
import { useEffect, useState } from "react";
import EventCard from "../components/EventCard";

function Events() {
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [date, setDate] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch events with participant counts
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          "http://localhost:5000/api/events"
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to fetch events."
          );
        }

        // Support either an array or { events: [...] }
        const eventList = Array.isArray(data)
          ? data
          : data.events || [];

        setEvents(
          eventList.map((event) => ({
            ...event,

            id: event._id || event.id,

            // Participant count from backend
            participantCount:
              event.participantCount ?? 0,

            // Date used for filtering
            eventDate: event.date
              ? new Date(event.date)
                  .toISOString()
                  .split("T")[0]
              : event.eventDate || "",

            // Formatted date for display
            date: event.date
              ? new Date(
                  event.date
                ).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : event.eventDate || "",
          }))
        );
      } catch (err) {
        console.error("Error fetching events:", err);

        setError(
          "Could not load events. Please check whether the backend server is running."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // Get categories from database events
  const categories = [
    "All",
    ...new Set(
      events
        .map((event) => event.category)
        .filter(Boolean)
    ),
  ];

  // Search and filter events
  const filteredEvents = events.filter((event) => {
    const searchText = search.toLowerCase();

    const matchesSearch =
      (event.title || "")
        .toLowerCase()
        .includes(searchText) ||
      (event.category || "")
        .toLowerCase()
        .includes(searchText) ||
      (event.location || "")
        .toLowerCase()
        .includes(searchText);

    const matchesCategory =
      category === "All" ||
      event.category === category;

    const matchesDate =
      date === "" ||
      event.eventDate === date;

    return (
      matchesSearch &&
      matchesCategory &&
      matchesDate
    );
  });

  const clearFilters = () => {
    setSearch("");
    setCategory("All");
    setDate("");
  };

  return (
    <main className="events-page">
      {/* Page Header */}
      <section className="events-header">
        <p className="section-tag">
          EXPLORE & PARTICIPATE
        </p>

        <h1>Discover Events</h1>

        <p>
          Find workshops, hackathons, technology events,
          sports and other exciting activities happening
          around you.
        </p>
      </section>

      {/* Search & Filters */}
      <section className="event-filters">
        <input
          type="text"
          placeholder="🔍 Search events..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="filter-select"
        >
          {categories.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="date-input"
        />

        <button
          onClick={clearFilters}
          className="clear-filter-btn"
        >
          Clear
        </button>
      </section>

      {/* Results */}
      <section className="events-results">
        <div className="results-heading">
          <h2>Upcoming Events</h2>

          <span>
            {filteredEvents.length} event
            {filteredEvents.length !== 1 ? "s" : ""}
          </span>
        </div>

        {loading ? (
          <div className="no-events">
            <p>Loading events...</p>
          </div>
        ) : error ? (
          <div className="no-events">
            <h3>Unable to load events</h3>
            <p>{error}</p>
          </div>
        ) : filteredEvents.length > 0 ? (
          <div className="event-grid">
            {filteredEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
              />
            ))}
          </div>
        ) : (
          <div className="no-events">
            <h3>No events found</h3>

            <p>
              {events.length === 0
                ? "No events have been created yet."
                : "Try changing your search or filters."}
            </p>

            <button
              onClick={clearFilters}
              className="primary-btn"
            >
              Show All Events
            </button>
          </div>
        )}
      </section>
    </main>
  );
}

export default Events;