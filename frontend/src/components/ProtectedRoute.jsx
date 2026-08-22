import { Navigate, useLocation } from "react-router-dom";

import useAuth from "../hooks/useAuth";
import Loader from "./Loader";

export default function ProtectedRoute({
  children,
  adminOnly = false,
}) {
  const {
    isAuthenticated,
    isAdmin,
    initializing,
  } = useAuth();

  const location = useLocation();

  if (initializing) {
    return (
      <main className="page">
        <Loader text="Checking your account..." />
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}