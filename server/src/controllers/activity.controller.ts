import type { Response } from "express";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { listRecentActivities } from "../services/activity.service.js";
import { AppError } from "../utils/app-error.js";

function requireActor(req: AuthenticatedRequest) {
  if (!req.user) {
    throw new AppError(401, "Authentication required");
  }

  return req.user;
}

export async function listRecentActivitiesHandler(
  req: AuthenticatedRequest,
  res: Response,
) {
  const actor = requireActor(req);
  const activities = await listRecentActivities(actor);

  res.status(200).json({
    success: true,
    data: activities,
  });
}
