import bcrypt from "bcrypt";
import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/app-error.js";
import {
  createAccessToken,
  createRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.js";

const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function publicUser(user: {
  id: number;
  name: string;
  email: string;
  role: string;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

async function findStoredRefreshToken(userId: number, refreshToken: string) {
  const tokens = await prisma.refreshToken.findMany({
    where: {
      userId,
      expiresAt: {
        gt: new Date(),
      },
    },
  });

  for (const token of tokens) {
    const isMatch = await bcrypt.compare(refreshToken, token.tokenHash);
    if (isMatch) {
      return token;
    }
  }

  return null;
}

export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new AppError(401, "Invalid email or password");
  }

  const passwordValid = await bcrypt.compare(password, user.passwordHash);

  if (!passwordValid) {
    throw new AppError(401, "Invalid email or password");
  }

  const accessToken = createAccessToken({
    userId: user.id,
    role: user.role,
  });

  const refreshToken = createRefreshToken(user.id);
  const refreshTokenHash = await bcrypt.hash(refreshToken, 12);

  await prisma.refreshToken.create({
    data: {
      tokenHash: refreshTokenHash,
      userId: user.id,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    },
  });

  return {
    accessToken,
    refreshToken,
    user: publicUser(user),
  };
}

export async function refreshUserSession(refreshToken: string) {
  let payload: { userId: number };

  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError(401, "Invalid or expired refresh token");
  }

  const matchedToken = await findStoredRefreshToken(
    payload.userId,
    refreshToken,
  );

  if (!matchedToken) {
    throw new AppError(401, "Invalid or expired refresh token");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: payload.userId,
    },
  });

  if (!user) {
    throw new AppError(401, "Invalid or expired refresh token");
  }

  const accessToken = createAccessToken({
    userId: user.id,
    role: user.role,
  });

  const newRefreshToken = createRefreshToken(user.id);
  const newRefreshTokenHash = await bcrypt.hash(newRefreshToken, 12);

  const rotated = await prisma.$transaction(async (tx) => {
    const deleted = await tx.refreshToken.deleteMany({
      where: {
        id: matchedToken.id,
      },
    });

    if (deleted.count !== 1) {
      return false;
    }

    await tx.refreshToken.create({
      data: {
        tokenHash: newRefreshTokenHash,
        userId: user.id,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
      },
    });

    return true;
  });

  if (!rotated) {
    throw new AppError(401, "Invalid or expired refresh token");
  }

  return {
    accessToken,
    refreshToken: newRefreshToken,
    user: publicUser(user),
  };
}

export async function logoutUser(refreshToken: string | undefined) {
  if (!refreshToken) {
    return;
  }

  let userId: number;

  try {
    userId = verifyRefreshToken(refreshToken).userId;
  } catch {
    return;
  }

  const matchedToken = await findStoredRefreshToken(userId, refreshToken);

  if (!matchedToken) {
    return;
  }

  await prisma.refreshToken.delete({
    where: {
      id: matchedToken.id,
    },
  });
}

export async function getAuthenticatedUser(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  if (!user) {
    throw new AppError(401, "Authentication required");
  }

  return publicUser(user);
}
