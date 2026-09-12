import { z } from "zod";
import { TaskPriority, TaskStatus } from "../generated/prisma/client.js";

const taskStatusSchema = z.enum([
  TaskStatus.TODO,
  TaskStatus.IN_PROGRESS,
  TaskStatus.IN_REVIEW,
  TaskStatus.DONE,
]);

const taskPrioritySchema = z.enum([
  TaskPriority.LOW,
  TaskPriority.MEDIUM,
  TaskPriority.HIGH,
  TaskPriority.CRITICAL,
]);

const dueDateSchema = z.coerce.date().refine(
  (value) => !Number.isNaN(value.getTime()),
  "A valid due date is required",
);

const idParamSchema = z
  .string()
  .regex(/^\d+$/, "A valid ID is required")
  .transform((value) => Number(value))
  .pipe(z.number().int().positive("A valid ID is required"));

export const createTaskBodySchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().trim().optional(),
  projectId: z.number().int().positive("A valid projectId is required"),
  developerId: z.number().int().positive("A valid developerId is required").optional(),
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  dueDate: dueDateSchema.optional(),
});

export const updateTaskBodySchema = z
  .object({
    title: z.string().trim().min(1, "Title is required").optional(),
    description: z.union([z.string().trim(), z.null()]).optional(),
    priority: taskPrioritySchema.optional(),
    dueDate: z.union([dueDateSchema, z.null()]).optional(),
  })
  .refine(
    (data) =>
      data.title !== undefined ||
      data.description !== undefined ||
      data.priority !== undefined ||
      data.dueDate !== undefined,
    { message: "At least one field is required" },
  );

export const assignTaskBodySchema = z.object({
  developerId: z
    .number()
    .int()
    .positive("A valid developerId is required")
    .nullable(),
});

export const updateTaskStatusBodySchema = z.object({
  status: taskStatusSchema,
});

export const taskIdParamsSchema = z.object({
  id: idParamSchema,
});

export const listTasksQuerySchema = z.object({
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  dueDateFrom: dueDateSchema.optional(),
  dueDateTo: dueDateSchema.optional(),
  projectId: idParamSchema.optional(),
});

export type CreateTaskBody = z.infer<typeof createTaskBodySchema>;
export type UpdateTaskBody = z.infer<typeof updateTaskBodySchema>;
export type AssignTaskBody = z.infer<typeof assignTaskBodySchema>;
export type UpdateTaskStatusBody = z.infer<typeof updateTaskStatusBodySchema>;
export type TaskIdParams = z.infer<typeof taskIdParamsSchema>;
export type ListTasksQuery = z.infer<typeof listTasksQuerySchema>;
