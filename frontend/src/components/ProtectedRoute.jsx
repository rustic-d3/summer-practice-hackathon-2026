import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/ProtectedRoute.scss";

export default function ProtectedRoute() {
  const { isLoggedIn, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="pr-loading">
        <span className="pr-spinner" />
        <p className="pr-loading-text">Verifying session…</p>
      </div>
    );
  }

  if (!isLoggedIn) {
    // Save where the user was trying to go so we can redirect back after login
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
