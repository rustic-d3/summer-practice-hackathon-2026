import { useState } from "react";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/AuthPage.scss";

export default function AuthPage() {
  const { login, register, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect to where the user was trying to go, or /dashboard by default
  const from = location.state?.from?.pathname || "/dashboard";

  const [mode, setMode] = useState("login");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  // 1. Full form state including all new profile fields
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    description: "",
    skill_level: "beginner",
    preferred_time: "anytime",
    looking_for: "both",
  });

  // 2. Separate state for the File object (images cannot be handled as strings in form state)
  const [avatar, setAvatar] = useState(null);

  // Already logged in → send straight to dashboard
  if (isLoggedIn) return <Navigate to={from} replace />;

  const isLogin = mode === "login";

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
    setSuccess("");
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setAvatar(e.target.files[0]);
    }
  };

  const switchMode = () => {
    setMode(isLogin ? "register" : "login");
    setError("");
    setSuccess("");
    setAvatar(null);
    setForm({
      username: "",
      email: "",
      password: "",
      description: "",
      skill_level: "beginner",
      preferred_time: "anytime",
      looking_for: "both",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (isLogin) {
        await login(form.username, form.password);
        navigate(from, { replace: true });
      } else {
        // 3. Send the full form object and the avatar file to the register function
        await register(form, avatar);
        setSuccess("Account created! Switching to login…");

        setTimeout(() => {
          setMode("login");
          // Keep username for convenience, clear sensitive/extra data
          setForm({ ...form, password: "", email: "" });
          setSuccess("");
        }, 1500);
      }
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-root">
      <div className="auth-bg">
        <span className="blob blob-1" />
        <span className="blob blob-2" />
        <span className="blob blob-3" />
      </div>

      <div className={`auth-card ${mode}`}>
        <div className="auth-brand">
          <span className="auth-logo">S2M</span>
          <p className="auth-tagline">ShowUp2Move</p>
        </div>

        <div className="auth-tabs">
          <button
            className={`tab ${isLogin ? "active" : ""}`}
            onClick={() => mode !== "login" && switchMode()}
            type="button"
          >
            Login
          </button>
          <button
            className={`tab ${!isLogin ? "active" : ""}`}
            onClick={() => mode !== "register" && switchMode()}
            type="button"
          >
            Register
          </button>
          <span className={`tab-indicator ${isLogin ? "left" : "right"}`} />
        </div>

        <form className="auth-form" onSubmit={handleSubmit} key={mode}>
          <div className="field">
            <label>Username</label>
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="your_username"
              autoComplete="username"
              required
            />
          </div>

          {!isLogin && (
            <>
              <div className="field field-slide">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </div>

              <div className="field field-slide">
                <label>Profile Picture</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="file-input"
                />
              </div>

              <div className="field field-slide">
                <label>Description (Bio)</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Tell us a bit about yourself..."
                />
              </div>

              <div className="field field-slide">
                <label>Skill Level</label>
                <select
                  name="skill_level"
                  value={form.skill_level}
                  onChange={handleChange}
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <div className="field field-slide">
                <label>Preferred Time</label>
                <select
                  name="preferred_time"
                  value={form.preferred_time}
                  onChange={handleChange}
                >
                  <option value="morning">Morning</option>
                  <option value="afternoon">Afternoon</option>
                  <option value="evening">Evening</option>
                  <option value="anytime">Anytime</option>
                </select>
              </div>

              <div className="field field-slide">
                <label>Looking For</label>
                <select
                  name="looking_for"
                  value={form.looking_for}
                  onChange={handleChange}
                >
                  <option value="partner">Partner</option>
                  <option value="group">Group</option>
                  <option value="both">Both</option>
                </select>
              </div>
            </>
          )}

          <div className="field">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              autoComplete={isLogin ? "current-password" : "new-password"}
              required
            />
          </div>

          {error && <p className="auth-error">{error}</p>}
          {success && <p className="auth-success">{success}</p>}

          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? (
              <span className="spinner" />
            ) : isLogin ? (
              "Sign In →"
            ) : (
              "Create Account →"
            )}
          </button>
        </form>

        <p className="auth-switch">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <button type="button" onClick={switchMode}>
            {isLogin ? "Register" : "Login"}
          </button>
        </p>
      </div>
    </div>
  );
}
