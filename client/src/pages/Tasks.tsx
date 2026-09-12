import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

interface Task {
  id: number;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  isOverdue: boolean;
  developerId: number | null;
}

function Tasks() {
  const { user } = useAuth();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [dueDateFrom, setDueDateFrom] = useState("");
  const [dueDateTo, setDueDateTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);

  async function loadTasks() {
    setLoading(true);

    try {
      const params: Record<string, string> = {};

      if (status) {
        params.status = status;
      }

      if (priority) {
        params.priority = priority;
      }

      if (dueDateFrom) {
        params.dueDateFrom = dueDateFrom;
      }

      if (dueDateTo) {
        params.dueDateTo = dueDateTo;
      }

      const response = await api.get<{
        success: boolean;
        data: Task[];
      }>("/tasks", { params });

      setTasks(response.data.data);
    } catch {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTasks();
  }, [status, priority, dueDateFrom, dueDateTo]);

  async function updateStatus(taskId: number, newStatus: string) {
    setUpdating(taskId);

    try {
      const response = await api.patch<{
        success: boolean;
        data: Task;
      }>(
        `/tasks/${taskId}/status`,
        { status: newStatus },
      );

      const updatedTask = response.data.data;

      setTasks((currentTasks) =>
        currentTasks.map((task) =>
          task.id === taskId ? updatedTask : task,
        ),
      );
    } catch {
      alert("Unable to update task status.");
    } finally {
      setUpdating(null);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Tasks</h1>
          <p>
            {user?.role === "DEVELOPER"
              ? "Tasks assigned to you."
              : "Manage tasks across your projects."}
          </p>
        </div>

        <div className="task-filters">
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="">All statuses</option>
            <option value="TODO">Todo</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="IN_REVIEW">In Review</option>
            <option value="DONE">Done</option>
          </select>

          <select
            value={priority}
            onChange={(event) => setPriority(event.target.value)}
          >
            <option value="">All priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>

          <label>
            From
            <input
              type="date"
              value={dueDateFrom}
              onChange={(event) => setDueDateFrom(event.target.value)}
            />
          </label>

          <label>
            To
            <input
              type="date"
              value={dueDateTo}
              onChange={(event) => setDueDateTo(event.target.value)}
            />
          </label>
        </div>
      </div>

      <section className="panel">
        <div className="panel-header">
          <h2>
            {loading ? "Loading tasks..." : `${tasks.length} Tasks`}
          </h2>
        </div>

        {!loading && tasks.length === 0 && (
          <p className="empty-state">No tasks found.</p>
        )}

        {tasks.map((task) => (
          <div className="task-row task-row-expanded" key={task.id}>
            <div className="task-main">
              <strong>{task.title}</strong>

              {task.description && (
                <p>{task.description}</p>
              )}

              <span>
                {task.priority}
                {task.dueDate &&
                  ` • Due ${new Date(task.dueDate).toLocaleDateString()}`}
              </span>

              {task.isOverdue && task.status !== "DONE" && (
                <span className="overdue-label">Overdue</span>
              )}
            </div>

            <div className="task-actions">
              <span
                className={`status ${task.status.toLowerCase()}`}
              >
                {task.status.replace("_", " ")}
              </span>

              {user?.role === "DEVELOPER" &&
                task.developerId === user.id &&
                task.status !== "DONE" && (
                  <select
                    value={task.status}
                    disabled={updating === task.id}
                    onChange={(event) =>
                      updateStatus(task.id, event.target.value)
                    }
                  >
                    <option value="TODO">Todo</option>
                    <option value="IN_PROGRESS">
                      In Progress
                    </option>
                    <option value="IN_REVIEW">In Review</option>
                    <option value="DONE">Done</option>
                  </select>
                )}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

export default Tasks;
