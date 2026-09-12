import { prisma } from "../config/prisma.js";
import {
  emitActivityNew,
  emitNotificationNew,
  emitTaskUpdated,
  emitUnreadCount,
} from "./events.js";
import { joinUserToRoom } from "./presence.js";
import { projectRoom } from "./rooms.js";

type RoomTarget = {
  projectId?: number | null;
  pmId?: number | null;
  developerIds?: Array<number | null | undefined>;
};

type TaskBroadcast = {
  projectId: number;
  developerId: number | null;
  project: { pmId: number };
};

async function unreadCountFor(userId: number) {
  return prisma.notification.count({
    where: {
      userId,
      isRead: false,
    },
  });
}

export async function publishNotifications(
  notifications: Array<{ userId: number }>,
) {
  const uniqueUserIds = [...new Set(notifications.map((item) => item.userId))];

  for (const notification of notifications) {
    emitNotificationNew(notification.userId, notification);
  }

  for (const userId of uniqueUserIds) {
    emitUnreadCount(userId, await unreadCountFor(userId));
  }
}

export async function publishUnreadCount(userId: number) {
  emitUnreadCount(userId, await unreadCountFor(userId));
}

export function publishActivities(activities: unknown[], target: RoomTarget) {
  for (const activity of activities) {
    emitActivityNew(activity, target);
  }
}

export function publishProjectCreated(
  activity: unknown,
  project: { id: number; pmId: number },
) {
  publishActivities([activity], {
    projectId: project.id,
    pmId: project.pmId,
  });
  joinUserToRoom(project.pmId, projectRoom(project.id));
}

export function publishTaskRealtime(options: {
  task: TaskBroadcast;
  previousDeveloperId?: number | null;
  activities: unknown[];
  notifications: Array<{ userId: number }>;
}) {
  const target: RoomTarget = {
    projectId: options.task.projectId,
    pmId: options.task.project.pmId,
    developerIds: [options.task.developerId, options.previousDeveloperId],
  };

  publishActivities(options.activities, target);
  emitTaskUpdated(options.task, target);

  if (options.task.developerId) {
    joinUserToRoom(
      options.task.developerId,
      projectRoom(options.task.projectId),
    );
  }

  return publishNotifications(options.notifications);
}
