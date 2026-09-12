import type { Request, Response } from "express";
import {
  loginUser,
  logoutUser,
  refreshUserSession,
} from "../services/auth.service.js";
import {
  clearRefreshTokenCookie,
  readRefreshTokenCookie,
  setRefreshTokenCookie,
} from "../utils/cookies.js";
import { AppError } from "../utils/app-error.js";
import type { LoginBody } from "../validators/auth.validators.js";

export async function login(req: Request, res: Response) {
  const { email, password } = req.body as LoginBody;
  const result = await loginUser(email, password);

  setRefreshTokenCookie(res, result.refreshToken);

  res.status(200).json({
    success: true,
    message: "Login successful",
    data: {
      accessToken: result.accessToken,
      user: result.user,
    },
  });
}

export async function refresh(req: Request, res: Response) {
  const refreshToken = readRefreshTokenCookie(req.cookies);

  if (!refreshToken) {
    throw new AppError(401, "Refresh token is required");
  }

  const result = await refreshUserSession(refreshToken);

  setRefreshTokenCookie(res, result.refreshToken);

  res.status(200).json({
    success: true,
    message: "Session refreshed",
    data: {
      accessToken: result.accessToken,
      user: result.user,
    },
  });
}

export async function logout(req: Request, res: Response) {
  const refreshToken = readRefreshTokenCookie(req.cookies);

  await logoutUser(refreshToken);
  clearRefreshTokenCookie(res);

  res.status(200).json({
    success: true,
    message: "Logged out",
  });
}
