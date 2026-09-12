import type { Server as HttpServer } from "node:http";
import { Role } from "../generated/prisma/client.js";
import { AppError } from "../utils/app-error.js";
import {
  assertCanJoinProjectRoom,
  listJoinableProjectIds,
} from "../services/project-access.service.js";
import { createSocketServer, type AppIo } from "./io.js";
import {
  addPresence,
  getOnlineUsers,
  removePresence,
} from "./presence.js";
import { ADMINS_ROOM, projectRoom, userRoom } from "./rooms.js";
import { authenticateSocket } from "./socket-auth.js";

function parseProjectId(value: unknown): number | null {
  if (typeof value === "number" && Number.isInteger(value) && value > 0) {
    return value;
  }

  return null;
}

export function attachRealtime(httpServer: HttpServer): AppIo {
  const io = createSocketServer(httpServer);

  io.use(authenticateSocket);

  io.on("connection", (socket) => {
    const user = socket.data.user;

    socket.join(userRoom(user.userId));

    if (user.role === Role.ADMIN) {
      socket.join(ADMINS_ROOM);
    }

    addPresence(user, socket.id);

    socket.emit("users:online", {
      success: true,
      data: {
        count: getOnlineUsers().length,
        users: getOnlineUsers(),
      },
    });

    socket.on("presence:get", () => {
      socket.emit("users:online", {
        success: true,
        data: {
          count: getOnlineUsers().length,
          users: getOnlineUsers(),
        },
      });
    });

    void (async () => {
      try {
        const projectIds = await listJoinableProjectIds({
          userId: user.userId,
          role: user.role,
        });

        if (!socket.connected) {
          return;
        }

        await Promise.all(
          projectIds.map((projectId) => socket.join(projectRoom(projectId))),
        );
      } catch {
        socket.disconnect(true);
      }
    })();

    socket.on("project:join", async (payload, ack) => {
      const projectId = parseProjectId(payload?.projectId);

      if (projectId === null) {
        ack?.({ success: false, message: "Invalid projectId" });
        return;
      }

      try {
        await assertCanJoinProjectRoom(
          { userId: user.userId, role: user.role },
          projectId,
        );
        await socket.join(projectRoom(projectId));
        ack?.({ success: true });
      } catch (error) {
        if (error instanceof AppError) {
          ack?.({ success: false, message: error.message });
          return;
        }

        ack?.({ success: false, message: "Unable to join project" });
      }
    });

    socket.on("project:leave", (payload, ack) => {
      const projectId = parseProjectId(payload?.projectId);

      if (projectId === null) {
        ack?.({ success: false, message: "Invalid projectId" });
        return;
      }

      socket.leave(projectRoom(projectId));
      ack?.({ success: true });
    });

    socket.on("disconnect", () => {
      removePresence(user.userId, socket.id);
    });
  });

  return io;
}
