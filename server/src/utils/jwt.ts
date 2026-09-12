import jwt, { type SignOptions } from "jsonwebtoken";
import { authConfig } from "../config/auth.js";

export type AccessTokenPayload = {
  userId: number;
  role: string;
};

const accessTokenOptions: SignOptions = {
  expiresIn: "15m",
};

const refreshTokenOptions: SignOptions = {
  expiresIn: "7d",
};

export function createAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(
    payload,
    authConfig.accessTokenSecret,
    accessTokenOptions,
  );
}

export function createRefreshToken(userId: number): string {
  return jwt.sign(
    { userId },
    authConfig.refreshTokenSecret,
    refreshTokenOptions,
  );
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(
    token,
    authConfig.accessTokenSecret,
  ) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): { userId: number } {
  return jwt.verify(
    token,
    authConfig.refreshTokenSecret,
  ) as { userId: number };
}