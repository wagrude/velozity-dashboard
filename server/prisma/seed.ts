import "dotenv/config";
import bcrypt from "bcrypt";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await bcrypt.hash("Password@123", 12);

  await prisma.$transaction(async (tx) => {
    await tx.activityLog.deleteMany();
    await tx.notification.deleteMany();
    await tx.task.deleteMany();
    await tx.project.deleteMany();
    await tx.refreshToken.deleteMany();
    await tx.user.deleteMany();

    const admin = await tx.user.create({
      data: {
        name: "Admin User",
        email: "admin@example.com",
        passwordHash,
        role: "ADMIN",
      },
    });

    const pm1 = await tx.user.create({
      data: {
        name: "Project Manager One",
        email: "pm1@example.com",
        passwordHash,
        role: "PM",
      },
    });

    const pm2 = await tx.user.create({
      data: {
        name: "Project Manager Two",
        email: "pm2@example.com",
        passwordHash,
        role: "PM",
      },
    });

    const dev1 = await tx.user.create({
      data: {
        name: "Developer One",
        email: "dev1@example.com",
        passwordHash,
        role: "DEVELOPER",
      },
    });

    const dev2 = await tx.user.create({
      data: {
        name: "Developer Two",
        email: "dev2@example.com",
        passwordHash,
        role: "DEVELOPER",
      },
    });

    const dev3 = await tx.user.create({
      data: {
        name: "Developer Three",
        email: "dev3@example.com",
        passwordHash,
        role: "DEVELOPER",
      },
    });

    const dev4 = await tx.user.create({
      data: {
        name: "Developer Four",
        email: "dev4@example.com",
        passwordHash,
        role: "DEVELOPER",
      },
    });

    const project1 = await tx.project.create({
      data: {
        name: "Project Alpha",
        description: "Customer dashboard and authentication platform",
        pmId: pm1.id,
      },
    });

    const project2 = await tx.project.create({
      data: {
        name: "Project Beta",
        description: "Real-time collaboration platform",
        pmId: pm1.id,
      },
    });

    const project3 = await tx.project.create({
      data: {
        name: "Project Gamma",
        description: "Analytics and reporting platform",
        pmId: pm2.id,
      },
    });

    const tasks = [
      {
        title: "Implement authentication UI",
        description: "Build login and logout screens",
        projectId: project1.id,
        developerId: dev1.id,
        status: "DONE" as const,
        priority: "HIGH" as const,
        dueDate: new Date("2026-09-05T23:59:00.000Z"),
        isOverdue: false,
      },
      {
        title: "Build dashboard layout",
        description: "Create responsive dashboard structure",
        projectId: project1.id,
        developerId: dev2.id,
        status: "IN_PROGRESS" as const,
        priority: "CRITICAL" as const,
        dueDate: new Date("2026-09-20T23:59:00.000Z"),
        isOverdue: false,
      },
      {
        title: "Implement project API",
        description: "Create project management endpoints",
        projectId: project1.id,
        developerId: dev3.id,
        status: "IN_REVIEW" as const,
        priority: "HIGH" as const,
        dueDate: new Date("2026-09-18T23:59:00.000Z"),
        isOverdue: false,
      },
      {
        title: "Add project filters",
        description: "Implement status and priority filters",
        projectId: project1.id,
        developerId: dev4.id,
        status: "TODO" as const,
        priority: "MEDIUM" as const,
        dueDate: new Date("2026-09-25T23:59:00.000Z"),
        isOverdue: false,
      },
      {
        title: "Fix authentication errors",
        description: "Resolve login validation issues",
        projectId: project1.id,
        developerId: dev1.id,
        status: "IN_PROGRESS" as const,
        priority: "CRITICAL" as const,
        dueDate: new Date("2026-09-08T23:59:00.000Z"),
        isOverdue: true,
      },

      {
        title: "Build Socket.IO activity feed",
        description: "Implement live activity updates",
        projectId: project2.id,
        developerId: dev2.id,
        status: "IN_PROGRESS" as const,
        priority: "HIGH" as const,
        dueDate: new Date("2026-09-22T23:59:00.000Z"),
        isOverdue: false,
      },
      {
        title: "Implement notification system",
        description: "Create notification APIs and realtime updates",
        projectId: project2.id,
        developerId: dev3.id,
        status: "TODO" as const,
        priority: "HIGH" as const,
        dueDate: new Date("2026-09-24T23:59:00.000Z"),
        isOverdue: false,
      },
      {
        title: "Create online presence tracking",
        description: "Track connected users through Socket.IO",
        projectId: project2.id,
        developerId: dev4.id,
        status: "DONE" as const,
        priority: "MEDIUM" as const,
        dueDate: new Date("2026-09-10T23:59:00.000Z"),
        isOverdue: false,
      },
      {
        title: "Add activity history API",
        description: "Return recent persisted activity events",
        projectId: project2.id,
        developerId: dev1.id,
        status: "IN_REVIEW" as const,
        priority: "MEDIUM" as const,
        dueDate: new Date("2026-09-19T23:59:00.000Z"),
        isOverdue: false,
      },
      {
        title: "Test realtime permissions",
        description: "Verify role-based Socket.IO access",
        projectId: project2.id,
        developerId: dev2.id,
        status: "TODO" as const,
        priority: "LOW" as const,
        dueDate: new Date("2026-09-28T23:59:00.000Z"),
        isOverdue: false,
      },

      {
        title: "Build analytics dashboard",
        description: "Create project performance metrics",
        projectId: project3.id,
        developerId: dev3.id,
        status: "IN_PROGRESS" as const,
        priority: "CRITICAL" as const,
        dueDate: new Date("2026-09-21T23:59:00.000Z"),
        isOverdue: false,
      },
      {
        title: "Implement reporting API",
        description: "Create analytics aggregation endpoints",
        projectId: project3.id,
        developerId: dev4.id,
        status: "TODO" as const,
        priority: "HIGH" as const,
        dueDate: new Date("2026-09-26T23:59:00.000Z"),
        isOverdue: false,
      },
      {
        title: "Add export functionality",
        description: "Allow users to export reports",
        projectId: project3.id,
        developerId: dev1.id,
        status: "TODO" as const,
        priority: "MEDIUM" as const,
        dueDate: new Date("2026-09-30T23:59:00.000Z"),
        isOverdue: false,
      },
      {
        title: "Optimize database queries",
        description: "Improve dashboard query performance",
        projectId: project3.id,
        developerId: dev2.id,
        status: "DONE" as const,
        priority: "HIGH" as const,
        dueDate: new Date("2026-09-07T23:59:00.000Z"),
        isOverdue: false,
      },
      {
        title: "Fix analytics calculation",
        description: "Correct project completion calculations",
        projectId: project3.id,
        developerId: dev3.id,
        status: "IN_REVIEW" as const,
        priority: "CRITICAL" as const,
        dueDate: new Date("2026-09-09T23:59:00.000Z"),
        isOverdue: true,
      },
    ];

    const createdTasks = [];

    for (const task of tasks) {
      const createdTask = await tx.task.create({
        data: task,
      });

      createdTasks.push(createdTask);

      await tx.activityLog.create({
        data: {
          type: "TASK_CREATED",
          message: `Task "${createdTask.title}" created`,
          taskId: createdTask.id,
          projectId: createdTask.projectId,
          userId: createdTask.developerId ?? admin.id,
        },
      });

      if (createdTask.developerId) {
        await tx.activityLog.create({
          data: {
            type: "TASK_ASSIGNED",
            message: `Task "${createdTask.title}" assigned to developer`,
            taskId: createdTask.id,
            projectId: createdTask.projectId,
            userId: admin.id,
          },
        });

        await tx.notification.create({
          data: {
            type: "TASK_ASSIGNED",
            message: `You were assigned task "${createdTask.title}"`,
            userId: createdTask.developerId,
          },
        });
      }

      if (createdTask.status === "IN_REVIEW") {
        const project = await tx.project.findUnique({
          where: { id: createdTask.projectId },
          select: { pmId: true },
        });

        if (project) {
          await tx.notification.create({
            data: {
              type: "TASK_IN_REVIEW",
              message: `Task "${createdTask.title}" is ready for review`,
              userId: project.pmId,
            },
          });
        }
      }

      if (createdTask.isOverdue) {
        const project = await tx.project.findUnique({
          where: { id: createdTask.projectId },
          select: { pmId: true },
        });

        if (project) {
          await tx.activityLog.create({
            data: {
              type: "TASK_OVERDUE",
              message: `Task "${createdTask.title}" is overdue`,
              taskId: createdTask.id,
              projectId: createdTask.projectId,
              userId: project.pmId,
            },
          });
        }
      }
    }

    await tx.activityLog.createMany({
      data: [
        {
          type: "PROJECT_CREATED",
          message: `Project "${project1.name}" created`,
          projectId: project1.id,
          userId: pm1.id,
        },
        {
          type: "PROJECT_CREATED",
          message: `Project "${project2.name}" created`,
          projectId: project2.id,
          userId: pm1.id,
        },
        {
          type: "PROJECT_CREATED",
          message: `Project "${project3.name}" created`,
          projectId: project3.id,
          userId: pm2.id,
        },
      ],
    });

    console.log("Seed completed successfully");
    console.log(`Admin: ${admin.email}`);
    console.log(`PMs: ${pm1.email}, ${pm2.email}`);
    console.log(
      `Developers: ${dev1.email}, ${dev2.email}, ${dev3.email}, ${dev4.email}`,
    );
    console.log(`Projects: ${project1.id}, ${project2.id}, ${project3.id}`);
    console.log(`Tasks: ${createdTasks.length}`);
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });