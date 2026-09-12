import type { Response } from "express";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import {
  assignTask,
  createTask,
  getTaskById,
  listTasks,
  updateTask,
  updateTaskStatus,
} from "../services/task.service.js";
import { AppError } from "../utils/app-error.js";
import type {
  AssignTaskBody,
  CreateTaskBody,
  ListTasksQuery,
  TaskIdParams,
  UpdateTaskBody,
  UpdateTaskStatusBody,
} from "../validators/task.validators.js";

function requireActor(req: AuthenticatedRequest) {
  if (!req.user) {
    throw new AppError(401, "Authentication required");
  }

  return req.user;
}

export async function createTaskHandler(
  req: AuthenticatedRequest,
  res: Response,
) {
  const actor = requireActor(req);
  const task = await createTask(actor, req.body as CreateTaskBody);

  res.status(201).json({
    success: true,
    data: task,
  });
}

export async function listTasksHandler(
  req: AuthenticatedRequest,
  res: Response,
) {
  const actor = requireActor(req);
  const tasks = await listTasks(actor, req.query as unknown as ListTasksQuery);

  res.status(200).json({
    success: true,
    data: tasks,
  });
}

export async function getTaskHandler(
  req: AuthenticatedRequest,
  res: Response,
) {
  const actor = requireActor(req);
  const { id } = req.params as unknown as TaskIdParams;
  const task = await getTaskById(actor, id);

  res.status(200).json({
    success: true,
    data: task,
  });
}

export async function updateTaskHandler(
  req: AuthenticatedRequest,
  res: Response,
) {
  const actor = requireActor(req);
  const { id } = req.params as unknown as TaskIdParams;
  const task = await updateTask(actor, id, req.body as UpdateTaskBody);

  res.status(200).json({
    success: true,
    data: task,
  });
}

export async function assignTaskHandler(
  req: AuthenticatedRequest,
  res: Response,
) {
  const actor = requireActor(req);
  const { id } = req.params as unknown as TaskIdParams;
  const task = await assignTask(actor, id, req.body as AssignTaskBody);

  res.status(200).json({
    success: true,
    data: task,
  });
}

export async function updateTaskStatusHandler(
  req: AuthenticatedRequest,
  res: Response,
) {
  const actor = requireActor(req);
  const { id } = req.params as unknown as TaskIdParams;
  const task = await updateTaskStatus(
    actor,
    id,
    req.body as UpdateTaskStatusBody,
  );

  res.status(200).json({
    success: true,
    data: task,
  });
}
