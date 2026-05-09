import { createContext, useContext, useState, useEffect } from "react";
import { authApi } from "../api/authApi";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true while verifying token on mount

  // On app load: validate existing token
  // Inside AuthContext.jsx
  useEffect(() => {
    const initAuth = async () => {
      if (authApi.isLoggedIn()) {
        try {
          const fullUser = await authApi.getMe();
          setUser(fullUser);
        } catch (err) {
          authApi.logout();
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (username, password) => {
    // 1. Get the token from the backend
    const data = await authApi.login(username, password);

    // 2. Save the token to localStorage
    localStorage.setItem("token", data.access_token);

    // 3. IMMEDIATELY fetch the full profile (including avatar_url)
    // This uses the token we just saved
    const fullUserProfile = await authApi.getMe();

    // 4. Update the 'user' state so Dashboard and other components see it
    setUser(fullUserProfile);

    return data;
  };

  const register = async (username, email, description, password) => {
    return authApi.register(username, email, description, password);
  };

  const logout = () => {
    authApi.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, isLoggedIn: !!user }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
