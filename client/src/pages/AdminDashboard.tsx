import { useEffect, useState } from "react";
import { api } from "../api/client";
import { getSocket } from "../api/socket";
import { useAuth } from "../context/AuthContext";
import ActivityFeed from "../components/ActivityFeed";

interface Task {
  id: number;
  title: string;
  status: string;
  priority: string;
  isOverdue: boolean;
}

interface Project {
  id: number;
  name: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

function AdminDashboard() {
  const { user } = useAuth();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [loading, setLoading] = useState(true);

  async function loadDashboard() {
    try {
      const [taskResponse, projectResponse] = await Promise.all([
        api.get<ApiResponse<Task[]>>("/tasks"),
        api.get<ApiResponse<Project[]>>("/projects"),
      ]);

      setTasks(taskResponse.data.data);
      setProjects(projectResponse.data.data);
    } catch {
      setTasks([]);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();

    const socket = getSocket();

    if (!socket) {
      return;
    }

    function handleTaskUpdate(
      payload: ApiResponse<Task>,
    ) {
      const updatedTask = payload.data;

      setTasks((current) => {
        const exists = current.some(
          (task) => task.id === updatedTask.id,
        );

        if (!exists) {
          return [updatedTask, ...current];
        }

        return current.map((task) =>
          task.id === updatedTask.id
            ? { ...task, ...updatedTask }
            : task,
        );
      });
    }

    function handleOnlineUsers(payload: unknown) {
      if (
        payload &&
        typeof payload === "object" &&
        "data" in payload
      ) {
        const data = (payload as {
          data?: { count?: unknown };
        }).data;

        if (data && typeof data.count === "number") {
          setOnlineUsers(data.count);
        }
      }
    }

    socket.on("task:updated", handleTaskUpdate);
    socket.on("users:online", handleOnlineUsers);
    socket.emit("presence:get");

    return () => {
      socket.off("task:updated", handleTaskUpdate);
      socket.off("users:online", handleOnlineUsers);
    };
  }, []);

  const todo = tasks.filter(
    (task) => task.status === "TODO",
  ).length;

  const inProgress = tasks.filter(
    (task) => task.status === "IN_PROGRESS",
  ).length;

  const inReview = tasks.filter(
    (task) => task.status === "IN_REVIEW",
  ).length;

  const done = tasks.filter(
    (task) => task.status === "DONE",
  ).length;

  const overdue = tasks.filter(
    (task) => task.isOverdue && task.status !== "DONE",
  ).length;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p>
            Welcome back, {user?.name}. Platform overview and
            activity.
          </p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span>Total Projects</span>
          <strong>{loading ? "..." : projects.length}</strong>
        </div>

        <div className="stat-card">
          <span>Total Tasks</span>
          <strong>{loading ? "..." : tasks.length}</strong>
        </div>

        <div className="stat-card">
          <span>Overdue Tasks</span>
          <strong>{loading ? "..." : overdue}</strong>
        </div>

        <div className="stat-card">
          <span>Online Users</span>
          <strong>{onlineUsers}</strong>
        </div>
      </div>

      <section className="panel">
        <div className="panel-header">
          <h2>Task Status</h2>
        </div>

        <div className="status-summary">
          <div>
            <span>Todo</span>
            <strong>{todo}</strong>
          </div>

          <div>
            <span>In Progress</span>
            <strong>{inProgress}</strong>
          </div>

          <div>
            <span>In Review</span>
            <strong>{inReview}</strong>
          </div>

          <div>
            <span>Done</span>
            <strong>{done}</strong>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>Recent Tasks</h2>
        </div>

        {!loading && tasks.length === 0 && (
          <p className="empty-state">No tasks available.</p>
        )}

        {tasks.slice(0, 8).map((task) => (
          <div className="task-row" key={task.id}>
            <div>
              <strong>{task.title}</strong>
              <span>
                {task.priority}
                {task.isOverdue && task.status !== "DONE"
                  ? " • Overdue"
                  : ""}
              </span>
            </div>

            <span
              className={`status ${task.status.toLowerCase()}`}
            >
              {task.status.replaceAll("_", " ")}
            </span>
          </div>
        ))}
      </section>

      <ActivityFeed />
    </div>
  );
}

export default AdminDashboard;
