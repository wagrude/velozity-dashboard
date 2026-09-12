import { getIO } from "./io.js";
import type { SocketUser } from "./io.js";

const socketsByUser = new Map<number, Set<string>>();
const profiles = new Map<number, SocketUser>();

export function addPresence(user: SocketUser, socketId: string) {
  const sockets = socketsByUser.get(user.userId) ?? new Set<string>();
  sockets.add(socketId);
  socketsByUser.set(user.userId, sockets);
  profiles.set(user.userId, user);
  emitOnlineUsers();
}

export function removePresence(userId: number, socketId: string) {
  const sockets = socketsByUser.get(userId);

  if (!sockets) {
    return;
  }

  sockets.delete(socketId);

  if (sockets.size === 0) {
    socketsByUser.delete(userId);
    profiles.delete(userId);
  }

  emitOnlineUsers();
}

export function getOnlineUsers(): SocketUser[] {
  return [...profiles.values()];
}

export function joinUserToRoom(userId: number, room: string) {
  const io = getIO();
  const sockets = socketsByUser.get(userId);

  if (!io || !sockets) {
    return;
  }

  for (const socketId of sockets) {
    io.sockets.sockets.get(socketId)?.join(room);
  }
}

export function emitOnlineUsers() {
  const io = getIO();

  if (!io) {
    return;
  }

  const users = getOnlineUsers();

  io.emit("users:online", {
    success: true,
    data: {
      count: users.length,
      users,
    },
  });
}
