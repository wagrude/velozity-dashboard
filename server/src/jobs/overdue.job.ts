import cron from "node-cron";
import { prisma } from "../config/prisma.js";
import { ActivityType, TaskStatus } from "../generated/prisma/client.js";
import { publishTaskRealtime } from "../realtime/publish.js";

export async function markOverdueTasks() {
  const now = new Date();

  const tasks = await prisma.task.findMany({
    where: {
      dueDate: { lt: now },
      status: { not: TaskStatus.DONE },
      isOverdue: false,
    },
    include: {
      project: {
        select: {
          id: true,
          pmId: true,
        },
      },
    },
  });

  for (const task of tasks) {
    const result = await prisma.$transaction(async (tx) => {
      const updatedTask = await tx.task.updateMany({
        where: {
          id: task.id,
          isOverdue: false,
        },
        data: {
          isOverdue: true,
        },
      });

      if (updatedTask.count === 0) {
        return null;
      }

      const activity = await tx.activityLog.create({
        data: {
          type: ActivityType.TASK_OVERDUE,
          message: `Task "${task.title}" is overdue`,
          taskId: task.id,
          projectId: task.projectId,
          userId: task.project.pmId,
        },
      });

      return { activity };
    });

    if (!result) {
      continue;
    }

    await publishTaskRealtime({
      task: {
        projectId: task.projectId,
        developerId: task.developerId,
        project: {
          pmId: task.project.pmId,
        },
      },
      activities: [result.activity],
      notifications: [],
    });
  }
}

export function startOverdueJob() {
  cron.schedule("*/5 * * * *", async () => {
    try {
      await markOverdueTasks();
    } catch (error) {
      console.error("Overdue job failed:", error);
    }
  });

  console.log("Overdue task job started");
}
