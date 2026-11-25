// components/common/ProtectedRoute.jsx
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/auth/useAuth";
import DataLoader from "./DataLoader";

export default function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Wait for session restore to finish
  if (loading) {
    return <DataLoader fullPage message="Checking session..." size="large" />;
  }

  // Not logged in → redirect to /login, remember where they were going
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Logged in → render the child routes
  return <Outlet />;
}