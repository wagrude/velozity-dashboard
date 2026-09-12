import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../hooks/useNotifications";

function Layout() {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="brand">
          <h2>Velozity</h2>
          <span>Project Dashboard</span>
        </div>

        <nav>
          <NavLink to="/dashboard">Dashboard</NavLink>

          {user?.role !== "DEVELOPER" && (
            <NavLink to="/projects">Projects</NavLink>
          )}

          <NavLink to="/tasks">Tasks</NavLink>

          <NavLink
            to="/notifications"
            className={({ isActive }) =>
              `notification-link ${
                isActive ? "active" : ""
              }`
            }
          >
            <span>Notifications</span>

            {unreadCount > 0 && (
              <span className="notification-badge">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </NavLink>
        </nav>

        <div className="sidebar-user">
          <strong>{user?.name}</strong>
          <span>{user?.role}</span>

          <button onClick={logout}>Logout</button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
