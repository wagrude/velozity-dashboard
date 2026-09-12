import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import DashboardRouter from "./pages/DashboardRouter";
import AdminDashboard from "./pages/AdminDashboard";
import PMDashboard from "./pages/PMDashboard";
import DeveloperDashboard from "./pages/DeveloperDashboard";
import Tasks from "./pages/Tasks";
import Projects from "./pages/Projects";
import Notifications from "./pages/Notifications";
import RoleRoute from "./components/RoleRoute";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
  <Route path="/login" element={<Login />} />

  <Route element={<ProtectedRoute />}>
    <Route element={<Layout />}>
      <Route path="/dashboard" element={<DashboardRouter />} />

      <Route element={<RoleRoute allowedRoles={["ADMIN"]} />}>
        <Route path="/admin" element={<AdminDashboard />} />
      </Route>

      <Route element={<RoleRoute allowedRoles={["PM"]} />}>
        <Route path="/pm" element={<PMDashboard />} />
      </Route>

      <Route element={<RoleRoute allowedRoles={["DEVELOPER"]} />}>
        <Route
          path="/developer"
          element={<DeveloperDashboard />}
        />
      </Route>

      <Route path="/tasks" element={<Tasks />} />

      <Route path="/notifications" element={<Notifications />} />

      <Route element={<RoleRoute allowedRoles={["ADMIN", "PM"]} />}>
        <Route path="/projects" element={<Projects />} />
      </Route>
    </Route>
  </Route>

  <Route
    path="/"
    element={<Navigate to="/dashboard" replace />}
  />

  <Route
    path="*"
    element={<Navigate to="/dashboard" replace />}
  />
</Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;