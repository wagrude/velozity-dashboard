import { getIO } from "./io.js";
import { ADMINS_ROOM, projectRoom, userRoom } from "./rooms.js";

type RoomTarget = {
  projectId?: number | null;
  pmId?: number | null;
  developerIds?: Array<number | null | undefined>;
};

function uniqueRooms(target: RoomTarget) {
  const rooms = new Set<string>([ADMINS_ROOM]);

  if (target.projectId) {
    rooms.add(projectRoom(target.projectId));
  }

  if (target.pmId) {
    rooms.add(userRoom(target.pmId));
  }

  for (const developerId of target.developerIds ?? []) {
    if (developerId) {
      rooms.add(userRoom(developerId));
    }
  }

  return [...rooms];
}

function emitToAuthorizedRooms(
  target: RoomTarget,
  event: "activity:new" | "task:updated",
  data: unknown,
) {
  const io = getIO();

  if (!io) {
    return;
  }

  const rooms = uniqueRooms(target);

  if (rooms.length === 0) {
    return;
  }

  io.to(rooms).emit(event, {
    success: true,
    data,
  });
}

export function emitActivityNew(activity: unknown, target: RoomTarget) {
  emitToAuthorizedRooms(target, "activity:new", activity);
}

export function emitTaskUpdated(task: unknown, target: RoomTarget) {
  emitToAuthorizedRooms(target, "task:updated", task);
}

export function emitNotificationNew(userId: number, notification: unknown) {
  const io = getIO();

  if (!io) {
    return;
  }

  io.to(userRoom(userId)).emit("notification:new", {
    success: true,
    data: notification,
  });
}

export function emitUnreadCount(userId: number, unreadCount: number) {
  const io = getIO();

  if (!io) {
    return;
  }

  io.to(userRoom(userId)).emit("notifications:unread-count", {
    success: true,
    data: { unreadCount },
  });
}
