import { prisma } from "../config/prisma.js";
import { publishUnreadCount } from "../realtime/publish.js";
import { AppError } from "../utils/app-error.js";

type Actor = {
  userId: number;
  role: string;
};

export async function listNotifications(actor: Actor) {
  return prisma.notification.findMany({
    where: { userId: actor.userId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getUnreadNotificationCount(actor: Actor) {
  const count = await prisma.notification.count({
    where: {
      userId: actor.userId,
      isRead: false,
    },
  });

  return { unreadCount: count };
}

export async function markNotificationRead(actor: Actor, notificationId: number) {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  });

  if (!notification) {
    throw new AppError(404, "Notification not found");
  }

  if (notification.userId !== actor.userId) {
    throw new AppError(403, "Forbidden");
  }

  const updated = await prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });

  await publishUnreadCount(actor.userId);

  return updated;
}

export async function markAllNotificationsRead(actor: Actor) {
  await prisma.notification.updateMany({
    where: {
      userId: actor.userId,
      isRead: false,
    },
    data: { isRead: true },
  });

  await publishUnreadCount(actor.userId);

  return { markedAllRead: true };
}
