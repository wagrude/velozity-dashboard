import { prisma } from "../config/prisma.js";
import { ActivityType, Role } from "../generated/prisma/client.js";
import { publishProjectCreated } from "../realtime/publish.js";
import { AppError } from "../utils/app-error.js";
import type {
  CreateProjectBody,
  UpdateProjectBody,
} from "../validators/project.validators.js";

type Actor = {
  userId: number;
  role: string;
};

function assertProjectManagerRole(role: string) {
  if (role === Role.ADMIN || role === Role.PM) {
    return;
  }

  throw new AppError(403, "Forbidden");
}

function assertCanAccessProject(actor: Actor, pmId: number) {
  if (actor.role === Role.ADMIN) {
    return;
  }

  if (actor.role === Role.PM && pmId === actor.userId) {
    return;
  }

  throw new AppError(403, "Forbidden");
}

async function resolveCreatePmId(actor: Actor, body: CreateProjectBody) {
  if (actor.role === Role.PM) {
    return actor.userId;
  }

  if (body.pmId === undefined) {
    throw new AppError(400, "pmId is required");
  }

  const pm = await prisma.user.findUnique({
    where: { id: body.pmId },
    select: { id: true, role: true },
  });

  if (!pm || pm.role !== Role.PM) {
    throw new AppError(400, "pmId must refer to an existing project manager");
  }

  return pm.id;
}

export async function createProject(actor: Actor, body: CreateProjectBody) {
  assertProjectManagerRole(actor.role);

  const pmId = await resolveCreatePmId(actor, body);

  const result = await prisma.$transaction(async (tx) => {
    const project = await tx.project.create({
      data: {
        name: body.name,
        pmId,
        ...(body.description !== undefined
          ? { description: body.description }
          : {}),
      },
    });

    const activity = await tx.activityLog.create({
      data: {
        type: ActivityType.PROJECT_CREATED,
        message: `Project "${project.name}" created`,
        projectId: project.id,
        userId: actor.userId,
      },
    });

    return { project, activity };
  });

  publishProjectCreated(result.activity, result.project);

  return result.project;
}

export async function listProjects(actor: Actor) {
  assertProjectManagerRole(actor.role);

  return prisma.project.findMany({
    ...(actor.role === Role.ADMIN ? {} : { where: { pmId: actor.userId } }),
    orderBy: { createdAt: "desc" },
  });
}

export async function getProjectById(actor: Actor, projectId: number) {
  assertProjectManagerRole(actor.role);

  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    throw new AppError(404, "Project not found");
  }

  assertCanAccessProject(actor, project.pmId);

  return project;
}

export async function updateProject(
  actor: Actor,
  projectId: number,
  body: UpdateProjectBody,
) {
  assertProjectManagerRole(actor.role);

  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    throw new AppError(404, "Project not found");
  }

  assertCanAccessProject(actor, project.pmId);

  return prisma.project.update({
    where: { id: projectId },
    data: {
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.description !== undefined
        ? { description: body.description }
        : {}),
    },
  });
}
