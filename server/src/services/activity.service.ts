import { prisma } from "../config/prisma.js";
import { Prisma, Role } from "../generated/prisma/client.js";
import { AppError } from "../utils/app-error.js";

type Actor = {
  userId: number;
  role: string;
};

const RECENT_ACTIVITY_LIMIT = 20;

const activityInclude = {
  user: {
    select: {
      id: true,
      name: true,
      role: true,
    },
  },
  project: {
    select: {
      id: true,
      name: true,
    },
  },
  task: {
    select: {
      id: true,
      title: true,
    },
  },
} as const;

function scopedActivityWhere(actor: Actor): Prisma.ActivityLogWhereInput {
  if (actor.role === Role.ADMIN) {
    return {};
  }

  if (actor.role === Role.PM) {
    return { project: { pmId: actor.userId } };
  }

  if (actor.role === Role.DEVELOPER) {
    return {
      OR: [
        { task: { developerId: actor.userId } },
        { project: { tasks: { some: { developerId: actor.userId } } } },
      ],
    };
  }

  throw new AppError(403, "Forbidden");
}

export async function listRecentActivities(actor: Actor) {
  return prisma.activityLog.findMany({
    where: scopedActivityWhere(actor),
    include: activityInclude,
    orderBy: { createdAt: "desc" },
    take: RECENT_ACTIVITY_LIMIT,
  });
}
