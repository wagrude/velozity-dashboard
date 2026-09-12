import { prisma } from "../config/prisma.js";
import {
  ActivityType,
  NotificationType,
  Prisma,
  Role,
  TaskStatus,
  type Notification,
} from "../generated/prisma/client.js";
import { publishTaskRealtime } from "../realtime/publish.js";
import { AppError } from "../utils/app-error.js";
import type {
  AssignTaskBody,
  CreateTaskBody,
  ListTasksQuery,
  UpdateTaskBody,
  UpdateTaskStatusBody,
} from "../validators/task.validators.js";

type Actor = {
  userId: number;
  role: string;
};

const taskInclude = {
  project: {
    select: {
      id: true,
      name: true,
      pmId: true,
    },
  },
  developer: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  },
} as const;

function scopedTaskWhere(actor: Actor): Prisma.TaskWhereInput {
  if (actor.role === Role.ADMIN) {
    return {};
  }

  if (actor.role === Role.PM) {
    return { project: { pmId: actor.userId } };
  }

  if (actor.role === Role.DEVELOPER) {
    return { developerId: actor.userId };
  }

  throw new AppError(403, "Forbidden");
}

function assertCanViewTask(
  actor: Actor,
  task: { developerId: number | null; project: { pmId: number } },
) {
  if (actor.role === Role.ADMIN) {
    return;
  }

  if (actor.role === Role.PM && task.project.pmId === actor.userId) {
    return;
  }

  if (actor.role === Role.DEVELOPER && task.developerId === actor.userId) {
    return;
  }

  throw new AppError(403, "Forbidden");
}

function assertCanManageProjectTasks(actor: Actor, pmId: number) {
  if (actor.role === Role.ADMIN) {
    return;
  }

  if (actor.role === Role.PM && pmId === actor.userId) {
    return;
  }

  throw new AppError(403, "Forbidden");
}

function assertCanChangeStatus(
  actor: Actor,
  task: { developerId: number | null; project: { pmId: number } },
) {
  if (actor.role === Role.ADMIN) {
    return;
  }

  if (actor.role === Role.PM && task.project.pmId === actor.userId) {
    return;
  }

  if (actor.role === Role.DEVELOPER && task.developerId === actor.userId) {
    return;
  }

  throw new AppError(403, "Forbidden");
}

async function requireDeveloper(developerId: number) {
  const developer = await prisma.user.findUnique({
    where: { id: developerId },
    select: { id: true, role: true },
  });

  if (!developer || developer.role !== Role.DEVELOPER) {
    throw new AppError(400, "developerId must refer to an existing developer");
  }

  return developer;
}

async function loadTaskOrThrow(taskId: number) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: taskInclude,
  });

  if (!task) {
    throw new AppError(404, "Task not found");
  }

  return task;
}

export async function createTask(actor: Actor, body: CreateTaskBody) {
  const project = await prisma.project.findUnique({
    where: { id: body.projectId },
    select: { id: true, pmId: true, name: true },
  });

  if (!project) {
    throw new AppError(404, "Project not found");
  }

  assertCanManageProjectTasks(actor, project.pmId);

  if (body.developerId !== undefined) {
    await requireDeveloper(body.developerId);
  }

  const result = await prisma.$transaction(async (tx) => {
    const task = await tx.task.create({
      data: {
        title: body.title,
        projectId: project.id,
        ...(body.description !== undefined
          ? { description: body.description }
          : {}),
        ...(body.developerId !== undefined
          ? { developerId: body.developerId }
          : {}),
        ...(body.status !== undefined ? { status: body.status } : {}),
        ...(body.priority !== undefined ? { priority: body.priority } : {}),
        ...(body.dueDate !== undefined ? { dueDate: body.dueDate } : {}),
      },
      include: taskInclude,
    });

    const activities = [
      await tx.activityLog.create({
        data: {
          type: ActivityType.TASK_CREATED,
          message: `Task "${task.title}" created in project "${project.name}"`,
          taskId: task.id,
          projectId: task.projectId,
          userId: actor.userId,
        },
      }),
    ];

    const notifications: Notification[] = [];

    if (task.developerId !== null) {
      activities.push(
        await tx.activityLog.create({
          data: {
            type: ActivityType.TASK_ASSIGNED,
            message: `Task "${task.title}" assigned to developer ${task.developerId}`,
            taskId: task.id,
            projectId: task.projectId,
            userId: actor.userId,
          },
        }),
      );

      notifications.push(
        await tx.notification.create({
          data: {
            type: NotificationType.TASK_ASSIGNED,
            message: `You were assigned to task "${task.title}"`,
            userId: task.developerId,
          },
        }),
      );
    }

    if (task.status === TaskStatus.IN_REVIEW) {
      notifications.push(
        await tx.notification.create({
          data: {
            type: NotificationType.TASK_IN_REVIEW,
            message: `Task "${task.title}" was moved to In Review`,
            userId: project.pmId,
          },
        }),
      );
    }

    return { task, activities, notifications };
  });

  await publishTaskRealtime({
    task: result.task,
    activities: result.activities,
    notifications: result.notifications,
  });

  return result.task;
}

export async function listTasks(actor: Actor, query: ListTasksQuery) {
  const filters: Prisma.TaskWhereInput[] = [scopedTaskWhere(actor)];

  if (query.status !== undefined) {
    filters.push({ status: query.status });
  }

  if (query.priority !== undefined) {
    filters.push({ priority: query.priority });
  }

  if (query.projectId !== undefined) {
    filters.push({ projectId: query.projectId });
  }

  if (query.dueDateFrom !== undefined || query.dueDateTo !== undefined) {
    const dueDateFilter: Prisma.DateTimeNullableFilter = {};

    if (query.dueDateFrom !== undefined) {
      dueDateFilter.gte = query.dueDateFrom;
    }

    if (query.dueDateTo !== undefined) {
      dueDateFilter.lte = query.dueDateTo;
    }

    filters.push({ dueDate: dueDateFilter });
  }

  return prisma.task.findMany({
    where: { AND: filters },
    include: taskInclude,
    orderBy: { createdAt: "desc" },
  });
}

export async function getTaskById(actor: Actor, taskId: number) {
  const task = await loadTaskOrThrow(taskId);
  assertCanViewTask(actor, task);
  return task;
}

export async function updateTask(
  actor: Actor,
  taskId: number,
  body: UpdateTaskBody,
) {
  const task = await loadTaskOrThrow(taskId);
  assertCanManageProjectTasks(actor, task.project.pmId);

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.task.update({
      where: { id: task.id },
      data: {
        ...(body.title !== undefined ? { title: body.title } : {}),
        ...(body.description !== undefined
          ? { description: body.description }
          : {}),
        ...(body.priority !== undefined ? { priority: body.priority } : {}),
        ...(body.dueDate !== undefined ? { dueDate: body.dueDate } : {}),
      },
      include: taskInclude,
    });

    const activity = await tx.activityLog.create({
      data: {
        type: ActivityType.TASK_UPDATED,
        message: `Task "${updated.title}" updated`,
        taskId: updated.id,
        projectId: updated.projectId,
        userId: actor.userId,
      },
    });

    return { task: updated, activity };
  });

  await publishTaskRealtime({
    task: result.task,
    activities: [result.activity],
    notifications: [],
  });

  return result.task;
}

export async function assignTask(
  actor: Actor,
  taskId: number,
  body: AssignTaskBody,
) {
  const task = await loadTaskOrThrow(taskId);
  assertCanManageProjectTasks(actor, task.project.pmId);

  if (body.developerId !== null) {
    await requireDeveloper(body.developerId);
  }

  const previousDeveloperId = task.developerId;
  const nextDeveloperId = body.developerId;

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.task.update({
      where: { id: task.id },
      data: { developerId: nextDeveloperId },
      include: taskInclude,
    });

    const activity = await tx.activityLog.create({
      data: {
        type: ActivityType.TASK_ASSIGNED,
        message:
          nextDeveloperId === null
            ? `Task "${updated.title}" unassigned`
            : `Task "${updated.title}" assigned to developer ${nextDeveloperId}`,
        taskId: updated.id,
        projectId: updated.projectId,
        userId: actor.userId,
      },
    });

    const notifications: Notification[] = [];

    if (
      nextDeveloperId !== null &&
      nextDeveloperId !== previousDeveloperId
    ) {
      notifications.push(
        await tx.notification.create({
          data: {
            type: NotificationType.TASK_ASSIGNED,
            message: `You were assigned to task "${updated.title}"`,
            userId: nextDeveloperId,
          },
        }),
      );
    }

    return { task: updated, activity, notifications };
  });

  await publishTaskRealtime({
    task: result.task,
    previousDeveloperId,
    activities: [result.activity],
    notifications: result.notifications,
  });

  return result.task;
}

export async function updateTaskStatus(
  actor: Actor,
  taskId: number,
  body: UpdateTaskStatusBody,
) {
  const task = await loadTaskOrThrow(taskId);
  assertCanChangeStatus(actor, task);

  const fromStatus = task.status;
  const toStatus = body.status;

  if (fromStatus === toStatus) {
    return task;
  }

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.task.update({
      where: { id: task.id },
      data: { status: toStatus },
      include: taskInclude,
    });

    const activity = await tx.activityLog.create({
      data: {
        type: ActivityType.STATUS_CHANGED,
        message: `Status changed from ${fromStatus} to ${toStatus} on task "${updated.title}"`,
        taskId: updated.id,
        projectId: updated.projectId,
        userId: actor.userId,
      },
    });

    const notifications: Notification[] = [];

    if (toStatus === TaskStatus.IN_REVIEW) {
      notifications.push(
        await tx.notification.create({
          data: {
            type: NotificationType.TASK_IN_REVIEW,
            message: `Task "${updated.title}" was moved to In Review`,
            userId: updated.project.pmId,
          },
        }),
      );
    }

    return { task: updated, activity, notifications };
  });

  await publishTaskRealtime({
    task: result.task,
    previousDeveloperId: task.developerId,
    activities: [result.activity],
    notifications: result.notifications,
  });

  return result.task;
}
