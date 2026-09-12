import type { Response } from "express";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import {
  createProject,
  getProjectById,
  listProjects,
  updateProject,
} from "../services/project.service.js";
import { AppError } from "../utils/app-error.js";
import type {
  CreateProjectBody,
  ProjectIdParams,
  UpdateProjectBody,
} from "../validators/project.validators.js";

function requireActor(req: AuthenticatedRequest) {
  if (!req.user) {
    throw new AppError(401, "Authentication required");
  }

  return req.user;
}

export async function createProjectHandler(
  req: AuthenticatedRequest,
  res: Response,
) {
  const actor = requireActor(req);
  const body = req.body as CreateProjectBody;
  const project = await createProject(actor, body);

  res.status(201).json({
    success: true,
    data: project,
  });
}

export async function listProjectsHandler(
  req: AuthenticatedRequest,
  res: Response,
) {
  const actor = requireActor(req);
  const projects = await listProjects(actor);

  res.status(200).json({
    success: true,
    data: projects,
  });
}

export async function getProjectHandler(
  req: AuthenticatedRequest,
  res: Response,
) {
  const actor = requireActor(req);
  const { id } = req.params as unknown as ProjectIdParams;
  const project = await getProjectById(actor, id);

  res.status(200).json({
    success: true,
    data: project,
  });
}

export async function updateProjectHandler(
  req: AuthenticatedRequest,
  res: Response,
) {
  const actor = requireActor(req);
  const { id } = req.params as unknown as ProjectIdParams;
  const body = req.body as UpdateProjectBody;
  const project = await updateProject(actor, id, body);

  res.status(200).json({
    success: true,
    data: project,
  });
}
