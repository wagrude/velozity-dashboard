import "dotenv/config";
import http from "node:http";
import bcrypt from "bcrypt";
import { io as ioClient, type Socket } from "socket.io-client";
import app from "../src/app.js";
import { prisma } from "../src/config/prisma.js";
import { Role, TaskStatus } from "../src/generated/prisma/client.js";
import { attachRealtime } from "../src/realtime/register.js";
import { createAccessToken } from "../src/utils/jwt.js";

type Ack = { success: boolean; message?: string };

function waitFor<T>(
  socket: Socket,
  event: string,
  timeoutMs = 4000,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off(event, onEvent);
      reject(new Error(`Timed out waiting for ${event}`));
    }, timeoutMs);

    function onEvent(payload: T) {
      clearTimeout(timer);
      resolve(payload);
    }

    socket.once(event, onEvent);
  });
}

function connect(url: string, token?: string) {
  return ioClient(url, {
    transports: ["websocket"],
    auth: token ? { token } : {},
    autoConnect: false,
  });
}

function connectResult(socket: Socket): Promise<void> {
  return new Promise((resolve, reject) => {
    socket.once("connect", () => resolve());
    socket.once("connect_error", (error) => reject(error));
    socket.connect();
  });
}

async function emitAck(
  socket: Socket,
  event: "project:join" | "project:leave",
  payload: { projectId: number },
): Promise<Ack> {
  return new Promise((resolve) => {
    socket.timeout(4000).emit(event, payload, (error: Error | null, ack: Ack) => {
      if (error) {
        resolve({ success: false, message: error.message });
        return;
      }

      resolve(ack);
    });
  });
}

async function jsonRequest(
  url: string,
  options: {
    method?: string;
    token?: string;
    body?: unknown;
  } = {},
) {
  const headers: Record<string, string> = {
    "content-type": "application/json",
  };

  if (options.token) {
    headers.authorization = `Bearer ${options.token}`;
  }

  const response = await fetch(url, {
    method: options.method ?? "GET",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  return {
    status: response.status,
    body: (await response.json()) as { success: boolean; data?: unknown },
  };
}

async function main() {
  const suffix = `${Date.now()}`;
  const passwordHash = await bcrypt.hash("Password@123", 12);

  const [admin, pm, otherPm, developer, outsider] = await prisma.$transaction([
    prisma.user.create({
      data: {
        name: "Realtime Admin",
        email: `rt-admin-${suffix}@example.com`,
        passwordHash,
        role: Role.ADMIN,
      },
    }),
    prisma.user.create({
      data: {
        name: "Realtime PM",
        email: `rt-pm-${suffix}@example.com`,
        passwordHash,
        role: Role.PM,
      },
    }),
    prisma.user.create({
      data: {
        name: "Realtime Other PM",
        email: `rt-pm2-${suffix}@example.com`,
        passwordHash,
        role: Role.PM,
      },
    }),
    prisma.user.create({
      data: {
        name: "Realtime Dev",
        email: `rt-dev-${suffix}@example.com`,
        passwordHash,
        role: Role.DEVELOPER,
      },
    }),
    prisma.user.create({
      data: {
        name: "Realtime Outsider",
        email: `rt-out-${suffix}@example.com`,
        passwordHash,
        role: Role.DEVELOPER,
      },
    }),
  ]);

  const httpServer = http.createServer(app);
  attachRealtime(httpServer);

  await new Promise<void>((resolve) => {
    httpServer.listen(0, "127.0.0.1", () => resolve());
  });

  const address = httpServer.address();
  if (!address || typeof address === "string") {
    throw new Error("Failed to bind test server");
  }

  const baseUrl = `http://127.0.0.1:${address.port}`;
  const tokens = {
    admin: createAccessToken({ userId: admin.id, role: admin.role }),
    pm: createAccessToken({ userId: pm.id, role: pm.role }),
    otherPm: createAccessToken({ userId: otherPm.id, role: otherPm.role }),
    developer: createAccessToken({ userId: developer.id, role: developer.role }),
    outsider: createAccessToken({
      userId: outsider.id,
      role: outsider.role,
    }),
  };

  const sockets: Socket[] = [];

  try {
    const invalid = connect(baseUrl, "not-a-jwt");
    sockets.push(invalid);
    let rejected = false;
    try {
      await connectResult(invalid);
    } catch {
      rejected = true;
    }
    if (!rejected) {
      throw new Error("invalid socket authentication was accepted");
    }

    const adminSocket = connect(baseUrl, tokens.admin);
    const pmSocket = connect(baseUrl, tokens.pm);
    const otherPmSocket = connect(baseUrl, tokens.otherPm);
    const developerSocket = connect(baseUrl, tokens.developer);
    const outsiderSocket = connect(baseUrl, tokens.outsider);
    sockets.push(
      adminSocket,
      pmSocket,
      otherPmSocket,
      developerSocket,
      outsiderSocket,
    );

    const onlinePromise = waitFor<{
      success: true;
      data: { count: number; users: Array<{ userId: number }> };
    }>(adminSocket, "users:online");

    await Promise.all([
      connectResult(adminSocket),
      connectResult(pmSocket),
      connectResult(otherPmSocket),
      connectResult(developerSocket),
      connectResult(outsiderSocket),
    ]);

    const online = await onlinePromise;
    if (!online.success || online.data.count < 1) {
      throw new Error("users:online was not emitted with a count");
    }

    const createdProject = await jsonRequest(`${baseUrl}/api/projects`, {
      method: "POST",
      token: tokens.pm,
      body: { name: `Realtime Project ${suffix}` },
    });
    if (createdProject.status !== 201 || !createdProject.body.success) {
      throw new Error("failed to create project for realtime test");
    }
    const project = createdProject.body.data as { id: number };

    const unauthorizedJoin = await emitAck(outsiderSocket, "project:join", {
      projectId: project.id,
    });
    if (unauthorizedJoin.success) {
      throw new Error("unauthorized project-room access was allowed");
    }

    const authorizedJoin = await emitAck(adminSocket, "project:join", {
      projectId: project.id,
    });
    if (!authorizedJoin.success) {
      throw new Error("authorized admin could not join project room");
    }

    const activityPromise = waitFor<{ success: true; data: { type: string } }>(
      adminSocket,
      "activity:new",
    );
    const taskPromise = waitFor<{ success: true; data: { id: number } }>(
      adminSocket,
      "task:updated",
    );
    const notificationPromise = waitFor<{
      success: true;
      data: { userId: number };
    }>(developerSocket, "notification:new");
    const unreadPromise = waitFor<{
      success: true;
      data: { unreadCount: number };
    }>(developerSocket, "notifications:unread-count");

    const createdTask = await jsonRequest(`${baseUrl}/api/tasks`, {
      method: "POST",
      token: tokens.pm,
      body: {
        title: `Realtime Task ${suffix}`,
        projectId: project.id,
        developerId: developer.id,
        status: TaskStatus.TODO,
      },
    });
    if (createdTask.status !== 201 || !createdTask.body.success) {
      throw new Error("failed to create task for realtime test");
    }
    const task = createdTask.body.data as { id: number };

    const activity = await activityPromise;
    const taskEvent = await taskPromise;
    const notification = await notificationPromise;
    const unread = await unreadPromise;

    if (activity.data.type !== "TASK_CREATED" && activity.data.type !== "TASK_ASSIGNED") {
      throw new Error("activity:new did not include a task event");
    }
    if (taskEvent.data.id !== task.id) {
      throw new Error("task:updated targeted the wrong task");
    }
    if (notification.data.userId !== developer.id) {
      throw new Error("notification:new was not targeted to the assigned developer");
    }
    if (unread.data.unreadCount < 1) {
      throw new Error("notifications:unread-count was not emitted");
    }

    const statusActivity = waitFor<{ success: true; data: { type: string } }>(
      adminSocket,
      "activity:new",
    );
    const statusTask = waitFor<{ success: true; data: { status: string } }>(
      adminSocket,
      "task:updated",
    );
    await jsonRequest(`${baseUrl}/api/tasks/${task.id}/status`, {
      method: "PATCH",
      token: tokens.pm,
      body: { status: TaskStatus.IN_PROGRESS },
    });
    const statusActivityPayload = await statusActivity;
    const statusTaskPayload = await statusTask;
    if (statusActivityPayload.data.type !== "STATUS_CHANGED") {
      throw new Error("status change did not emit activity:new");
    }
    if (statusTaskPayload.data.status !== TaskStatus.IN_PROGRESS) {
      throw new Error("status change did not emit task:updated");
    }

    const afterRead = waitFor<{
      success: true;
      data: { unreadCount: number };
    }>(developerSocket, "notifications:unread-count");
    await jsonRequest(`${baseUrl}/api/notifications/read-all`, {
      method: "PATCH",
      token: tokens.developer,
    });
    const readPayload = await afterRead;
    if (readPayload.data.unreadCount !== 0) {
      throw new Error("read-all did not emit unread count 0");
    }

    const missed = await jsonRequest(`${baseUrl}/api/activities`, {
      token: tokens.admin,
    });
    if (
      missed.status !== 200 ||
      !Array.isArray(missed.body.data) ||
      missed.body.data.length === 0
    ) {
      throw new Error("latest activities were not fetched from PostgreSQL");
    }
    if ((missed.body.data as unknown[]).length > 20) {
      throw new Error("activity feed returned more than 20 events");
    }

    const outsiderMissed = await jsonRequest(`${baseUrl}/api/activities`, {
      token: tokens.outsider,
    });
    if (
      outsiderMissed.status !== 200 ||
      !Array.isArray(outsiderMissed.body.data) ||
      outsiderMissed.body.data.length !== 0
    ) {
      throw new Error("unauthorized developer received other projects' activity");
    }

    console.log("Realtime verification passed");
    console.log(JSON.stringify({
      rejectedInvalidAuth: true,
      authorizedConnect: true,
      unauthorizedProjectJoinRejected: true,
      activityAndTaskEvents: true,
      targetedNotification: true,
      unreadCountEvents: true,
      onlineUsers: true,
      missedEventsFromDatabase: true,
    }, null, 2));
  } finally {
    for (const socket of sockets) {
      socket.removeAllListeners();
      socket.disconnect();
    }

    await new Promise<void>((resolve, reject) => {
      httpServer.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });

    await prisma.notification.deleteMany({
      where: { userId: { in: [admin.id, pm.id, otherPm.id, developer.id, outsider.id] } },
    });
    await prisma.activityLog.deleteMany({
      where: { userId: { in: [admin.id, pm.id, otherPm.id, developer.id, outsider.id] } },
    });
    await prisma.task.deleteMany({
      where: { project: { pmId: { in: [pm.id, otherPm.id] } } },
    });
    await prisma.project.deleteMany({
      where: { pmId: { in: [pm.id, otherPm.id] } },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [admin.id, pm.id, otherPm.id, developer.id, outsider.id] } },
    });
    await prisma.$disconnect();
  }
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
