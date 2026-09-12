import { useEffect, useState } from "react";
import { api } from "../api/client";

interface Project {
  id: number;
  name: string;
  description: string | null;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    api
      .get<ApiResponse<Project[]>>("/projects")
      .then((response) => {
        setProjects(response.data.data);
      })
      .catch(() => {
        setProjects([]);
      });
  }, []);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Projects</h1>
          <p>Projects available to your account.</p>
        </div>
      </div>

      <div className="projects-grid">
        {projects.map((project) => (
          <div className="project-card" key={project.id}>
            <h3>{project.name}</h3>
            <p>
              {project.description || "No description available."}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Projects;
