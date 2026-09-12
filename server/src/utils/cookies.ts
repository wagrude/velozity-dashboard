import type { CookieOptions, Response } from "express";

const REFRESH_TOKEN_COOKIE = "refreshToken";
const REFRESH_TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function refreshCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    maxAge: REFRESH_TOKEN_MAX_AGE_MS,
    path: "/",
  };
}

export function setRefreshTokenCookie(res: Response, refreshToken: string) {
  res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, refreshCookieOptions());
}

export function clearRefreshTokenCookie(res: Response) {
  res.clearCookie(REFRESH_TOKEN_COOKIE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    path: "/",
  });
}

export function readRefreshTokenCookie(
  cookies: Record<string, unknown> | undefined,
): string | undefined {
  const value = cookies?.[REFRESH_TOKEN_COOKIE];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}
