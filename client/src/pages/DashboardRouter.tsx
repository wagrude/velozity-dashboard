import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function DashboardRouter() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === "ADMIN") {
    return <Navigate to="/admin" replace />;
  }

  if (user.role === "PM") {
    return <Navigate to="/pm" replace />;
  }

  return <Navigate to="/developer" replace />;
}

export default DashboardRouter;
