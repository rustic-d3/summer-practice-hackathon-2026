import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authApi } from "../api/authApi";
import "../styles/Dashboard.scss";

const SKILL_BADGE = {
  beginner: { label: "Beginner", color: "#98CD00" },
  intermediate: { label: "Intermediate", color: "#B6F500" },
  advanced: { label: "Advanced", color: "#fff176" },
};

const TIME_ICON = {
  morning: "🌅",
  afternoon: "☀️",
  evening: "🌙",
  anytime: "⏰",
};

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // State Management
  const [activeTab, setActiveTab] = useState("mine"); // "mine" | "matches"
  const [myEvents, setMyEvents] = useState([]);
  const [matchedEvents, setMatchedEvents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form State for New Event
  const [eventForm, setEventForm] = useState({
    title: "",
    sport_type: "",
    location: "",
    event_skill_level: user?.skill_level || "beginner",
    event_time: user?.preferred_time || "anytime",
  });

  // Fetch Data on Tab Change
  useEffect(() => {
    setLoading(true);
    if (activeTab === "mine") {
      authApi
        .getMyEvents()
        .then(setMyEvents)
        .catch((err) => console.error("Error fetching my events:", err))
        .finally(() => setLoading(false));
    } else {
      authApi
        .getMatchedEvents()
        .then(setMatchedEvents)
        .catch((err) => console.error("Error fetching matched events:", err))
        .finally(() => setLoading(false));
    }
  }, [activeTab]);

  const handleLogout = () => {
    logout();
    navigate("/auth", { replace: true });
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      await authApi.createEvent(eventForm);
      setShowModal(false);
      setEventForm({
        title: "",
        sport_type: "",
        location: "",
        event_skill_level: user?.skill_level || "beginner",
        event_time: user?.preferred_time || "anytime",
      });
      // Refresh my events after creating
      const updated = await authApi.getMyEvents();
      setMyEvents(updated);
      if (activeTab !== "mine") setActiveTab("mine");
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  return (
    <div className="dash-root">
      {/* Background Decor */}
      <div className="dash-bg">
        <span className="dash-blob dash-blob-1" />
        <span className="dash-blob dash-blob-2" />
      </div>

      <header className="dash-header">
        <span className="dash-brand">S2M</span>
        <div className="dash-nav-profile">
          {user?.avatar_url && (
            <img
              src={user.avatar_url}
              alt="nav-avatar"
              className="dash-nav-img"
            />
          )}
          <button className="dash-logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <main className="dash-main">
        {/* Profile Info Card */}
        <div className="dash-profile-section">
          <div className="dash-avatar-wrapper">
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt="Profile"
                className="dash-avatar-img"
              />
            ) : (
              <div className="dash-avatar-placeholder">
                {user?.username?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="dash-greeting">
            <p className="dash-label">Welcome back</p>
            <h1 className="dash-username">{user?.username}</h1>
            <p className="dash-email">{user?.email}</p>
            {user?.description && (
              <p className="dash-bio">{user?.description}</p>
            )}

            {/* Badges row */}
            <div className="dash-badges">
              {user?.skill_level && (
                <span
                  className="dash-badge"
                  style={{
                    borderColor: SKILL_BADGE[user.skill_level]?.color,
                    color: SKILL_BADGE[user.skill_level]?.color,
                  }}
                >
                  {SKILL_BADGE[user.skill_level]?.label}
                </span>
              )}
              {user?.preferred_time && (
                <span className="dash-badge">
                  {TIME_ICON[user.preferred_time]}{" "}
                  {user.preferred_time.charAt(0).toUpperCase() +
                    user.preferred_time.slice(1)}
                </span>
              )}
              {user?.looking_for && (
                <span className="dash-badge">
                  Looking for {user.looking_for}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="dash-controls">
          <div className="dash-tabs">
            <button
              className={`dash-tab ${activeTab === "mine" ? "active" : ""}`}
              onClick={() => setActiveTab("mine")}
            >
              My Events
            </button>
            <button
              className={`dash-tab ${activeTab === "matches" ? "active" : ""}`}
              onClick={() => setActiveTab("matches")}
            >
              Find Matches
            </button>
          </div>

          <button
            className="create-event-btn"
            onClick={() => setShowModal(true)}
          >
            <span>+</span> Create Event
          </button>
        </div>

        {/* Content Display */}
        <section className="dash-content">
          {loading ? (
            <div className="dash-loader">Loading...</div>
          ) : activeTab === "mine" ? (
            // ── My Events ──────────────────────────────────────────────
            <div className="dash-events-grid">
              {myEvents.length === 0 ? (
                <div className="dash-empty-state">
                  <p className="dash-empty-icon">🏟️</p>
                  <p className="dash-empty-title">No events yet</p>
                  <p className="dash-empty-sub">
                    Create your first sport match and find partners.
                  </p>
                  <button
                    className="create-event-btn"
                    onClick={() => setShowModal(true)}
                  >
                    <span>+</span> Create Event
                  </button>
                </div>
              ) : (
                myEvents.map((event) => (
                  <div className="event-card event-card--mine" key={event.id}>
                    <div className="event-header">
                      <span className="event-tag">{event.sport_type}</span>
                      <span
                        className="event-skill"
                        style={{
                          color: SKILL_BADGE[event.event_skill_level]?.color,
                        }}
                      >
                        {SKILL_BADGE[event.event_skill_level]?.label ||
                          event.event_skill_level}
                      </span>
                    </div>
                    <h3>{event.title}</h3>
                    <p>📍 {event.location}</p>
                    <p>
                      {TIME_ICON[event.event_time]}{" "}
                      {event.event_time.charAt(0).toUpperCase() +
                        event.event_time.slice(1)}
                    </p>
                    <span className="mine-label">Your event</span>
                  </div>
                ))
              )}
            </div>
          ) : (
            // ── Find Matches ───────────────────────────────────────────
            <div className="dash-events-grid">
              {matchedEvents.length === 0 ? (
                <div className="dash-empty-state">
                  <p className="dash-empty-icon">🔍</p>
                  <p className="dash-empty-title">No matches found</p>
                  <p className="dash-empty-sub">
                    No events match your skill level and schedule right now.
                  </p>
                </div>
              ) : (
                matchedEvents.map((event) => (
                  <div className="event-card" key={event.id}>
                    <div className="event-header">
                      <span className="event-tag">{event.sport_type}</span>
                      <span
                        className="event-skill"
                        style={{
                          color: SKILL_BADGE[event.event_skill_level]?.color,
                        }}
                      >
                        {SKILL_BADGE[event.event_skill_level]?.label ||
                          event.event_skill_level}
                      </span>
                    </div>
                    <h3>{event.title}</h3>
                    <p>📍 {event.location}</p>
                    <p>
                      {TIME_ICON[event.event_time]}{" "}
                      {event.event_time.charAt(0).toUpperCase() +
                        event.event_time.slice(1)}
                    </p>
                    <button className="join-btn">Join Match</button>
                  </div>
                ))
              )}
            </div>
          )}
        </section>
      </main>

      {/* Create Event Modal */}
      {showModal && (
        <div
          className="modal-overlay"
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
        >
          <div className="modal-card">
            <div className="modal-header">
              <h2>New Sport Match</h2>
              <button onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleCreateEvent}>
              <div className="form-group">
                <label>Match Title</label>
                <input
                  type="text"
                  placeholder="e.g. Morning Tennis"
                  required
                  value={eventForm.title}
                  onChange={(e) =>
                    setEventForm({ ...eventForm, title: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label>Sport</label>
                <input
                  type="text"
                  placeholder="e.g. Football"
                  required
                  value={eventForm.sport_type}
                  onChange={(e) =>
                    setEventForm({ ...eventForm, sport_type: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label>Location</label>
                <input
                  type="text"
                  placeholder="e.g. Central Park"
                  required
                  value={eventForm.location}
                  onChange={(e) =>
                    setEventForm({ ...eventForm, location: e.target.value })
                  }
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Skill Level</label>
                  <select
                    value={eventForm.event_skill_level}
                    onChange={(e) =>
                      setEventForm({
                        ...eventForm,
                        event_skill_level: e.target.value,
                      })
                    }
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Time Preference</label>
                  <select
                    value={eventForm.event_time}
                    onChange={(e) =>
                      setEventForm({ ...eventForm, event_time: e.target.value })
                    }
                  >
                    <option value="morning">Morning</option>
                    <option value="afternoon">Afternoon</option>
                    <option value="evening">Evening</option>
                    <option value="anytime">Anytime</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="submit-event-btn">
                Post Event
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
