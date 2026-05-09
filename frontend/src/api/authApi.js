const BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

// ── Helper ─────────────────────────────────────────────────────────────────
async function handleResponse(res) {
  const data = await res.json();
  if (!res.ok) {
    // FastAPI validation errors come as { detail: [...] } or { detail: "string" }
    const msg = Array.isArray(data.detail)
      ? data.detail.map((e) => e.msg).join(", ")
      : data.detail || "Request failed";
    throw new Error(msg);
  }
  return data;
}

function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ── Auth endpoints ─────────────────────────────────────────────────────────
export const authApi = {
  /**
   * POST /auth/register
   * Body: JSON { username, email, password }
   */
  register: async (userData, avatarFile) => {
    const formData = new FormData();

    // Append all text fields from your registration form
    // userData should be an object: { username, email, password, description, skill_level, etc. }
    Object.keys(userData).forEach((key) => {
      formData.append(key, userData[key]);
    });

    // Append the avatar file if the user selected one
    if (avatarFile) {
      formData.append("avatar", avatarFile);
    }

    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      // IMPORTANT: Do NOT set "Content-Type" header when using FormData.
      // The browser will automatically set it to "multipart/form-data" with the correct boundary.
      body: formData,
    });
    return handleResponse(res);
  },

  /**
   * POST /auth/login
   * Body: x-www-form-urlencoded (OAuth2PasswordRequestForm)
   */
  login: async (username, password) => {
    const body = new URLSearchParams({ username, password });
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
    return handleResponse(res); // returns { access_token, token_type }
  },

  /**
   * GET /users/me
   * Requires Bearer token
   */
  getMe: async () => {
    const res = await fetch(`${BASE_URL}/users/me`, {
      headers: authHeaders(),
    });
    return handleResponse(res);
  },

  /**
   * GET /users/me/items
   * Requires Bearer token
   */
  getMyItems: async () => {
    const res = await fetch(`${BASE_URL}/users/me/items`, {
      headers: authHeaders(),
    });
    return handleResponse(res);
  },

  /**
   * Remove token from localStorage (client-side logout)
   */
  logout: () => {
    localStorage.removeItem("token");
  },

  /**
   * Returns true if a token exists in localStorage
   */
  isLoggedIn: () => !!localStorage.getItem("token"),

  // Upload profile picture
  uploadAvatar: async (file) => {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${BASE_URL}/users/me/avatar`, {
      method: "POST",
      headers: authHeaders(), // no Content-Type — browser sets it with boundary
      body: form,
    });
    return handleResponse(res);
  },

  getSports: async () => {
    const res = await fetch(`${BASE_URL}/sports`);
    return handleResponse(res);
  },

  setUserSports: async (sportIds) => {
    const res = await fetch(`${BASE_URL}/users/me/sports`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(sportIds),
    });
    return handleResponse(res);
  },

  updateProfile: async (data) => {
    const res = await fetch(`${BASE_URL}/users/me`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  createEvent: async (eventData) => {
    const res = await fetch(`${BASE_URL}/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(), // This sends the Bearer token
      },
      body: JSON.stringify(eventData),
    });
    return handleResponse(res);
  },
  getMyEvents: async () => {
    const res = await fetch(`${BASE_URL}/events/mine`, {
      headers: authHeaders(),
    });
    return handleResponse(res);
  },

  getMatchedEvents: async () => {
    const res = await fetch(`${BASE_URL}/events/matches`, {
      headers: authHeaders(),
    });
    return handleResponse(res);
  },
};
