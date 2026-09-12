import { useEffect, useState } from "react";
import { api } from "../api/client";
import ActivityFeed from "../components/ActivityFeed";

interface Project {
  id: number;
  name: string;
  description: string | null;
}

interface Task {
  id: number;
  title: string;
  status: string;
  priority: string;
  isOverdue: boolean;
}

function PMDashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    Promise.all([api.get<{ success: boolean; data: Project[] }>("/projects"), api.get<{ success: boolean; data: Task[] }>("/tasks")])
      .then(([projectsResponse, tasksResponse]) => {
        setProjects(projectsResponse.data.data);
        setTasks(tasksResponse.data.data);
      })
      .catch(() => {
        setProjects([]);
        setTasks([]);
      });
  }, []);

  const overdue = tasks.filter((task) => task.isOverdue).length;
  const review = tasks.filter(
    (task) => task.status === "IN_REVIEW",
  ).length;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>PM Dashboard</h1>
          <p>Manage your projects and team activity.</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span>My Projects</span>
          <strong>{projects.length}</strong>
        </div>

        <div className="stat-card">
          <span>Total Tasks</span>
          <strong>{tasks.length}</strong>
        </div>

        <div className="stat-card">
          <span>In Review</span>
          <strong>{review}</strong>
        </div>

        <div className="stat-card">
          <span>Overdue</span>
          <strong>{overdue}</strong>
        </div>
      </div>

      <section className="panel">
        <div className="panel-header">
          <h2>My Projects</h2>
        </div>

        {projects.map((project) => (
          <div className="project-row" key={project.id}>
            <div>
              <strong>{project.name}</strong>
              <p>{project.description}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>Priority Tasks</h2>
        </div>

        {tasks
          .filter(
            (task) =>
              task.priority === "CRITICAL" ||
              task.priority === "HIGH",
          )
          .slice(0, 8)
          .map((task) => (
            <div className="task-row" key={task.id}>
              <strong>{task.title}</strong>
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

export default PMDashboard;
