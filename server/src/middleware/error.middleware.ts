import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/app-error.js";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  if (res.headersSent) {
    next(err);
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.errors !== undefined ? { errors: err.errors } : {}),
    });
    return;
  }

  if (
    err &&
    typeof err === "object" &&
    "type" in err &&
    (err as { type?: string }).type === "entity.parse.failed"
  ) {
    res.status(400).json({
      success: false,
      message: "Invalid JSON body",
    });
    return;
  }

  console.error(err);

  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
}
