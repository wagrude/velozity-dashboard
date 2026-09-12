import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";

export type SocketUser = {
  userId: number;
  role: string;
  name: string;
};

export type ServerToClientEvents = {
  "activity:new": (payload: { success: true; data: unknown }) => void;
  "task:updated": (payload: { success: true; data: unknown }) => void;
  "notification:new": (payload: { success: true; data: unknown }) => void;
  "notifications:unread-count": (payload: {
    success: true;
    data: { unreadCount: number };
  }) => void;
  "users:online": (payload: {
    success: true;
    data: { count: number; users: SocketUser[] };
  }) => void;
};

export type ClientToServerEvents = {
  "presence:get": () => void;
  "project:join": (
    payload: { projectId: number },
    ack?: (result: { success: boolean; message?: string }) => void,
  ) => void;
  "project:leave": (
    payload: { projectId: number },
    ack?: (result: { success: boolean; message?: string }) => void,
  ) => void;
};

export type SocketData = {
  user: SocketUser;
};

export type AppIo = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  SocketData
>;

let io: AppIo | null = null;

export function getIO(): AppIo | null {
  return io;
}

export function createSocketServer(httpServer: HttpServer): AppIo {
  io = new Server<
    ClientToServerEvents,
    ServerToClientEvents,
    Record<string, never>,
    SocketData
  >(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      credentials: true,
    },
  });

  return io;
}
