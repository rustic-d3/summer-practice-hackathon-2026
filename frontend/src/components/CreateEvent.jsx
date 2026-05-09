// CreateEvent.jsx
export default function CreateEvent() {
  const [form, setForm] = useState({
    title: "",
    sport_type: "",
    event_skill_level: "beginner",
    event_time: "morning",
    looking_for: "partner",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Send to POST /events
    await eventApi.create(form);
    alert("Event Created! Only matching users will see this.");
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <div className="field">
        <label>Event Title</label>
        <input name="title" onChange={handleChange} required />
      </div>

      <div className="field">
        <label>Skill Level for this game</label>
        <select name="event_skill_level" onChange={handleChange}>
          <option value="beginner">Beginner</option>
          <option value="advanced">Advanced</option>
        </select>
      </div>

      <button className="auth-submit" type="submit">
        Create Match
      </button>
    </form>
  );
}
