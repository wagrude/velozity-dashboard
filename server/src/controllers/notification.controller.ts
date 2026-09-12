import type { Response } from "express";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import {
  getUnreadNotificationCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../services/notification.service.js";
import { AppError } from "../utils/app-error.js";
import type { NotificationIdParams } from "../validators/notification.validators.js";

function requireActor(req: AuthenticatedRequest) {
  if (!req.user) {
    throw new AppError(401, "Authentication required");
  }

  return req.user;
}

export async function listNotificationsHandler(
  req: AuthenticatedRequest,
  res: Response,
) {
  const actor = requireActor(req);
  const notifications = await listNotifications(actor);

  res.status(200).json({
    success: true,
    data: notifications,
  });
}

export async function unreadNotificationCountHandler(
  req: AuthenticatedRequest,
  res: Response,
) {
  const actor = requireActor(req);
  const data = await getUnreadNotificationCount(actor);

  res.status(200).json({
    success: true,
    data,
  });
}

export async function markNotificationReadHandler(
  req: AuthenticatedRequest,
  res: Response,
) {
  const actor = requireActor(req);
  const { id } = req.params as unknown as NotificationIdParams;
  const notification = await markNotificationRead(actor, id);

  res.status(200).json({
    success: true,
    data: notification,
  });
}

export async function markAllNotificationsReadHandler(
  req: AuthenticatedRequest,
  res: Response,
) {
  const actor = requireActor(req);
  const data = await markAllNotificationsRead(actor);

  res.status(200).json({
    success: true,
    data,
  });
}
