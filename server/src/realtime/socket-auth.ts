import type { Socket } from "socket.io";
import { prisma } from "../config/prisma.js";
import { verifyAccessToken } from "../utils/jwt.js";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  SocketData,
} from "./io.js";

type HandshakeSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  SocketData
>;

function readAccessToken(socket: HandshakeSocket): string | undefined {
  const authToken = (socket.handshake.auth as { token?: unknown }).token;

  if (typeof authToken === "string" && authToken.length > 0) {
    return authToken.startsWith("Bearer ") ? authToken.slice(7) : authToken;
  }

  const header = socket.handshake.headers.authorization;

  if (typeof header === "string" && header.startsWith("Bearer ")) {
    return header.substring(7);
  }

  return undefined;
}

export async function authenticateSocket(
  socket: HandshakeSocket,
  next: (err?: Error) => void,
) {
  const token = readAccessToken(socket);

  if (!token) {
    next(new Error("Authentication required"));
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        name: true,
        role: true,
      },
    });

    if (!user) {
      next(new Error("Invalid or expired access token"));
      return;
    }

    socket.data.user = {
      userId: user.id,
      role: user.role,
      name: user.name,
    };

    next();
  } catch {
    next(new Error("Invalid or expired access token"));
  }
}
