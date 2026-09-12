import { prisma } from "../config/prisma.js";
import { Role } from "../generated/prisma/client.js";
import { AppError } from "../utils/app-error.js";

type Actor = {
  userId: number;
  role: string;
};

export async function assertCanJoinProjectRoom(
  actor: Actor,
  projectId: number,
) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, pmId: true },
  });

  if (!project) {
    throw new AppError(404, "Project not found");
  }

  if (actor.role === Role.ADMIN) {
    return project;
  }

  if (actor.role === Role.PM && project.pmId === actor.userId) {
    return project;
  }

  if (actor.role === Role.DEVELOPER) {
    const assignedTask = await prisma.task.findFirst({
      where: {
        projectId: project.id,
        developerId: actor.userId,
      },
      select: { id: true },
    });

    if (assignedTask) {
      return project;
    }
  }

  throw new AppError(403, "Forbidden");
}

export async function listJoinableProjectIds(actor: Actor) {
  if (actor.role === Role.ADMIN) {
    return [];
  }

  if (actor.role === Role.PM) {
    const projects = await prisma.project.findMany({
      where: { pmId: actor.userId },
      select: { id: true },
    });

    return projects.map((project) => project.id);
  }

  if (actor.role === Role.DEVELOPER) {
    const tasks = await prisma.task.findMany({
      where: { developerId: actor.userId },
      distinct: ["projectId"],
      select: { projectId: true },
    });

    return tasks.map((task) => task.projectId);
  }

  return [];
}
