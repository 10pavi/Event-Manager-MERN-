import { Link } from "react-router-dom";

function EventCard({ event }) {
  return (
    <div className="event-card">
      <div className="event-card-image">
        <span className="event-category">{event.category}</span>
      </div>

      <div className="event-card-content">
        <p className="event-card-date">{event.date}</p>

        <h3>{event.title}</h3>

        <p className="event-card-location">
          📍 {event.location}
        </p>

        <p className="event-card-description">
          {event.description}
        </p>

        <Link
          to={`/events/${event.id}`}
          className="event-details-btn"
        >
          View Details →
        </Link>
      </div>
    </div>
  );
}

export default EventCard;