import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import ActivityFeed from "../components/ActivityFeed";

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

interface Task {
  id: number;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
  isOverdue: boolean;
}

function DeveloperDashboard() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    api
      .get<ApiResponse<Task[]>>("/tasks")
      .then((response) => setTasks(response.data.data))
      .catch(() => setTasks([]));
  }, []);

  const active = tasks.filter((task) => task.status !== "DONE");
  const overdue = tasks.filter((task) => task.isOverdue);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>My Dashboard</h1>
          <p>Welcome back, {user?.name}</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span>Assigned Tasks</span>
          <strong>{tasks.length}</strong>
        </div>

        <div className="stat-card">
          <span>Active</span>
          <strong>{active.length}</strong>
        </div>

        <div className="stat-card">
          <span>Overdue</span>
          <strong>{overdue.length}</strong>
        </div>
      </div>

      <section className="panel">
        <div className="panel-header">
          <h2>My Tasks</h2>
        </div>

        {tasks.map((task) => (
          <div className="task-row" key={task.id}>
            <div>
              <strong>{task.title}</strong>

              <span>
                {task.priority}
                {task.dueDate &&
                  ` • Due ${new Date(task.dueDate).toLocaleDateString()}`}
              </span>
            </div>

            <span className={`status ${task.status.toLowerCase()}`}>
              {task.status.replace("_", " ")}
            </span>
          </div>
        ))}
      </section>
      <ActivityFeed />
    </div>
  );
}

export default DeveloperDashboard;
