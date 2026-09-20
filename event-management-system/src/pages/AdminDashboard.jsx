
import { Fragment, useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

const API_URL = "http://localhost:5000/api/events";

const emptyForm = {
  title: "",
  description: "",
  category: "",
  date: "",
  time: "",
  location: "",
  image: "",
  capacity: "",
};

function AdminDashboard() {
  const [events, setEvents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingEventId, setDeletingEventId] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [participantsByEvent, setParticipantsByEvent] = useState({});
  const [expandedEvent, setExpandedEvent] = useState(null);
  const [participantsLoading, setParticipantsLoading] = useState(null);

  const [formData, setFormData] = useState(emptyForm);

  // Recent Activity state
  const [activities, setActivities] = useState([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [activityError, setActivityError] = useState("");

  const getToken = () =>
    localStorage.getItem("token") ||
    sessionStorage.getItem("token");

  // ==========================================
  // FETCH EVENTS
  // ==========================================
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(API_URL);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load events.");
      }

      setEvents(Array.isArray(data) ? data : data.events || []);
    } catch (err) {
      setError(
        err.message === "Failed to fetch"
          ? "Cannot connect to backend. Make sure it is running."
          : err.message
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // ==========================================
  // FETCH RECENT ACTIVITY
  // ==========================================
  const fetchActivity = useCallback(async () => {
    setActivityLoading(true);
    setActivityError("");

    const token = getToken();

    if (!token) {
      setActivityError("Please log in as admin to view recent activity.");
      setActivities([]);
      setActivityLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/activity`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load recent activity."
        );
      }

      setActivities(Array.isArray(data) ? data : []);
    } catch (err) {
      setActivityError(
        err.message === "Failed to fetch"
          ? "Cannot connect to backend. Make sure it is running."
          : err.message
      );
    } finally {
      setActivityLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
    fetchActivity();
  }, [fetchEvents, fetchActivity]);

  // ==========================================
  // HANDLE FORM INPUTS
  // ==========================================
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ==========================================
  // RESET FORM
  // ==========================================
  const resetForm = () => {
    setFormData(emptyForm);
    setEditingEventId(null);
    setShowForm(false);
  };

  // ==========================================
  // CREATE OR UPDATE EVENT
  // ==========================================
  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    const token = getToken();

    if (!token) {
      setError("Please log in as admin again.");
      return;
    }

    setSaving(true);

    const isEditing = Boolean(editingEventId);

    const url = isEditing
      ? `${API_URL}/${editingEventId}`
      : API_URL;

    try {
      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          capacity: Number(formData.capacity),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            (isEditing
              ? "Could not update event."
              : "Could not create event.")
        );
      }

      setSuccess(
        data.message ||
          (isEditing
            ? "Event updated successfully!"
            : "Event created successfully!")
      );

      resetForm();

      setParticipantsByEvent({});
      setExpandedEvent(null);

      await Promise.all([
        fetchEvents(),
        fetchActivity(),
      ]);
    } catch (err) {
      setError(
        err.message === "Failed to fetch"
          ? "Cannot connect to backend. Make sure it is running."
          : err.message
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // LOAD EVENT INTO FORM FOR EDITING
  // ==========================================
  const handleEdit = (event) => {
    setError("");
    setSuccess("");

    setFormData({
      title: event.title || "",
      description: event.description || "",
      category: event.category || "",
      date: event.date
        ? new Date(event.date).toISOString().slice(0, 10)
        : "",
      time: event.time || "",
      location: event.location || "",
      image: event.image || "",
      capacity: event.capacity ?? "",
    });

    setEditingEventId(event._id);
    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ==========================================
  // DELETE EVENT
  // ==========================================
  const handleDelete = async (event) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${event.title}"? This will also delete its registrations.`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    const token = getToken();

    if (!token) {
      setError("Please log in as admin again.");
      return;
    }

    setDeletingEventId(event._id);

    try {
      const response = await fetch(`${API_URL}/${event._id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not delete event.");
      }

      setSuccess(data.message || "Event deleted successfully!");

      if (editingEventId === event._id) {
        resetForm();
      }

      if (expandedEvent === event._id) {
        setExpandedEvent(null);
      }

      setParticipantsByEvent((previous) => {
        const updated = { ...previous };
        delete updated[event._id];
        return updated;
      });

      await Promise.all([
        fetchEvents(),
        fetchActivity(),
      ]);
    } catch (err) {
      setError(
        err.message === "Failed to fetch"
          ? "Cannot connect to backend. Make sure it is running."
          : err.message
      );
    } finally {
      setDeletingEventId(null);
    }
  };

  // ==========================================
  // VIEW REGISTERED PARTICIPANTS
  // ==========================================
  const handleViewParticipants = async (eventId) => {
    if (expandedEvent === eventId) {
      setExpandedEvent(null);
      return;
    }

    setExpandedEvent(eventId);
    setError("");

    if (participantsByEvent[eventId]) {
      return;
    }

    const token = getToken();

    if (!token) {
      setError("Please log in as admin again.");
      return;
    }

    setParticipantsLoading(eventId);

    try {
      const response = await fetch(
        `${API_URL}/${eventId}/participants`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Could not load participants."
        );
      }

      const participants = Array.isArray(data)
        ? data
        : data.participants || [];

      setParticipantsByEvent((previous) => ({
        ...previous,
        [eventId]: participants,
      }));
    } catch (err) {
      setError(
        err.message === "Failed to fetch"
          ? "Cannot connect to backend. Make sure it is running."
          : err.message
      );
    } finally {
      setParticipantsLoading(null);
    }
  };

  // ==========================================
  // FORMAT DATE
  // ==========================================
  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // ==========================================
  // FORMAT ACTIVITY DATE AND TIME
  // ==========================================
  const formatActivityDate = (date) => {
    if (!date) return "";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "";
    }

    return parsedDate.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ==========================================
  // ACTIVITY ICON
  // ==========================================
  const getActivityIcon = (action) => {
    switch (action) {
      case "EVENT_CREATED":
        return "📅";
      case "EVENT_UPDATED":
        return "✏️";
      case "EVENT_DELETED":
        return "🗑️";
      case "USER_REGISTERED":
        return "🎟️";
      case "REGISTRATION_CANCELLED":
        return "↩️";
      default:
        return "🔔";
    }
  };

  // ==========================================
  // DASHBOARD STATISTICS
  // ==========================================
  const totalParticipants = events.reduce(
    (total, event) =>
      total + Number(event.participantCount || 0),
    0
  );

  const upcomingEvents = events.filter(
    (event) =>
      event.date &&
      new Date(event.date) >= new Date()
  ).length;

  const organizers = new Set(
    events
      .map((event) => event.createdBy?._id || event.createdBy)
      .filter(Boolean)
      .map(String)
  ).size;

  // ==========================================
  // UI
  // ==========================================
  return (
    <main className="admin-page">
      <section className="admin-header">
        <div>
          <p className="section-tag">ADMIN PANEL</p>
          <h1>Dashboard</h1>
          <p>
            Manage events, participants and event activities
            from one place.
          </p>
        </div>

        <button
          className="admin-add-btn"
          type="button"
          onClick={() => {
            if (showForm) {
              resetForm();
            } else {
              setFormData(emptyForm);
              setEditingEventId(null);
              setShowForm(true);
            }

            setError("");
            setSuccess("");
          }}
        >
          {showForm ? "Close Form" : "+ Create Event"}
        </button>
      </section>

      {error && (
        <p role="alert" className="admin-message error-message">
          {error}
        </p>
      )}

      {success && (
        <p role="status" className="admin-message success-message">
          {success}
        </p>
      )}

      {/* Create / Edit form */}
      {showForm && (
        <section className="admin-form-section">
          <div className="admin-section-heading">
            <div>
              <p className="section-tag">
                {editingEventId ? "EDIT EVENT" : "NEW EVENT"}
              </p>

              <h2>
                {editingEventId ? "Edit Event" : "Create an Event"}
              </h2>
            </div>
          </div>

          <form
            className="admin-event-form"
            onSubmit={handleSubmit}
          >
            <div className="admin-form-grid">
              <div className="form-group">
                <label htmlFor="title">Event Title</label>
                <input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="category">Category</label>
                <input
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  placeholder="Technology, Workshop..."
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="date">Date</label>
                <input
                  id="date"
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="time">Time</label>
                <input
                  id="time"
                  name="time"
                  type="time"
                  value={formData.time}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="location">Venue</label>
                <input
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="capacity">Capacity</label>
                <input
                  id="capacity"
                  name="capacity"
                  type="number"
                  min="1"
                  value={formData.capacity}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group admin-full-width">
                <label htmlFor="image">Image URL (optional)</label>
                <input
                  id="image"
                  name="image"
                  type="url"
                  value={formData.image}
                  onChange={handleChange}
                  placeholder="https://..."
                />
              </div>

              <div className="form-group admin-full-width">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  rows="4"
                  value={formData.description}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="admin-form-actions">
              <button
                type="submit"
                className="admin-create-btn"
                disabled={saving}
              >
                {saving
                  ? editingEventId
                    ? "Saving Changes..."
                    : "Creating..."
                  : editingEventId
                    ? "Save Changes"
                    : "Save Event"}
              </button>

              {editingEventId && (
                <button
                  type="button"
                  className="admin-cancel-btn"
                  onClick={resetForm}
                  disabled={saving}
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
        </section>
      )}

      {/* Dashboard statistics */}
      <section className="admin-stats">
        <div className="admin-stat-card">
          <div className="admin-stat-icon">📅</div>
          <div>
            <p>Total Events</p>
            <h2>{events.length}</h2>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon">👥</div>
          <div>
            <p>Total Participants</p>
            <h2>{totalParticipants}</h2>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon">🎯</div>
          <div>
            <p>Upcoming Events</p>
            <h2>{upcomingEvents}</h2>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon">🏢</div>
          <div>
            <p>Organizers</p>
            <h2>{organizers || "—"}</h2>
          </div>
        </div>
      </section>

      {/* Event management table */}
      <section className="admin-events-section">
        <div className="admin-section-heading">
          <div>
            <p className="section-tag">EVENT MANAGEMENT</p>
            <h2>Manage Events</h2>
          </div>
        </div>

        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Event</th>
                <th>Date</th>
                <th>Venue</th>
                <th>Participants</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6">Loading events...</td>
                </tr>
              ) : events.length === 0 ? (
                <tr>
                  <td colSpan="6">
                    No events yet. Add your first event!
                  </td>
                </tr>
              ) : (
                events.map((event) => (
                  <Fragment key={event._id}>
                    <tr>
                      <td>
                        <div className="admin-event-name">
                          <div className="admin-event-image">
                            {event.category}
                          </div>

                          <div>
                            <strong>{event.title}</strong>
                            <span>{event.category}</span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="admin-date">
                          {formatDate(event.date)}
                        </span>
                      </td>

                      <td>
                        <span className="admin-location">
                          📍 {event.location}
                        </span>
                      </td>

                      <td>
                        <div className="participant-count">
                          <strong>
                            {Number(event.participantCount || 0)}
                          </strong>
                          <span> / {event.capacity}</span>
                        </div>
                      </td>

                      <td>
                        <span className="event-status">Active</span>
                      </td>

                      <td>
                        <div className="admin-actions">
                          <Link
                            to={`/events/${event._id}`}
                            className="view-action"
                          >
                            View
                          </Link>

                          <button
                            type="button"
                            className="view-action"
                            onClick={() => handleEdit(event)}
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="view-action"
                            onClick={() =>
                              handleViewParticipants(event._id)
                            }
                          >
                            {expandedEvent === event._id
                              ? "Hide Participants"
                              : "View Participants"}
                          </button>

                          <button
                            type="button"
                            className="delete-action"
                            onClick={() => handleDelete(event)}
                            disabled={deletingEventId === event._id}
                          >
                            {deletingEventId === event._id
                              ? "Deleting..."
                              : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>

                    {expandedEvent === event._id && (
                      <tr>
                        <td colSpan="6">
                          <div className="admin-participants-list">
                            <h3>
                              Registered Participants — {event.title}
                            </h3>

                            {participantsLoading === event._id ? (
                              <p>Loading participants...</p>
                            ) : !participantsByEvent[event._id] ? (
                              <p>
                                Participant information is not available.
                              </p>
                            ) : participantsByEvent[event._id].length === 0 ? (
                              <p>
                                No participants have registered yet.
                              </p>
                            ) : (
                              <ul>
                                {participantsByEvent[event._id].map(
                                  (participant, index) => {
                                    const person =
                                      participant.user || participant;

                                    return (
                                      <li
                                        key={participant._id || index}
                                      >
                                        <strong>
                                          {person.name || "Name unavailable"}
                                        </strong>

                                        <span>
                                          {person.email || "Email unavailable"}
                                        </span>
                                      </li>
                                    );
                                  }
                                )}
                              </ul>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Dynamic Recent Activity */}
      <section className="admin-activity-section">
        <div className="admin-section-heading">
          <div>
            <p className="section-tag">RECENT ACTIVITY</p>
            <h2>Recent Activity</h2>
          </div>

          <button
            type="button"
            className="view-action"
            onClick={fetchActivity}
            disabled={activityLoading}
          >
            {activityLoading ? "Refreshing..." : "↻ Refresh"}
          </button>
        </div>

        <div className="activity-card">
          {activityLoading ? (
            <p className="activity-empty">Loading recent activity...</p>
          ) : activityError ? (
            <p className="activity-empty" role="alert">
              {activityError}
            </p>
          ) : activities.length === 0 ? (
            <p className="activity-empty">
              No recent activity found yet.
            </p>
          ) : (
            <div className="activity-list">
              {activities.map((activity) => (
                <div
                  className="activity-item"
                  key={activity._id}
                >
                  <div className="activity-icon">
                    {getActivityIcon(activity.action)}
                  </div>

                  <div className="activity-content">
                    <strong>{activity.message}</strong>

                    {activity.userEmail && (
                      <p>{activity.userEmail}</p>
                    )}

                    <span className="activity-time">
                      {formatActivityDate(activity.createdAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

export default AdminDashboard;