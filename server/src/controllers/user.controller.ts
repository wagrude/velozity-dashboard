import type { Response } from "express";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { getAuthenticatedUser } from "../services/auth.service.js";
import { AppError } from "../utils/app-error.js";

export async function getCurrentUser(
  req: AuthenticatedRequest,
  res: Response,
) {
  const userId = req.user?.userId;

  if (userId === undefined) {
    throw new AppError(401, "Authentication required");
  }

  const user = await getAuthenticatedUser(userId);

  res.status(200).json({
    success: true,
    data: user,
  });
}
