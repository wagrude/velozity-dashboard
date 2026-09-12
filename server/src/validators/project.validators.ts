import { z } from "zod";

export const createProjectBodySchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z.string().trim().optional(),
  pmId: z.number().int().positive("A valid pmId is required").optional(),
});

export const updateProjectBodySchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").optional(),
    description: z.union([z.string().trim(), z.null()]).optional(),
  })
  .refine(
    (data) => data.name !== undefined || data.description !== undefined,
    { message: "At least one field is required" },
  );

export const projectIdParamsSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/, "A valid project ID is required")
    .transform((value) => Number(value))
    .pipe(z.number().int().positive("A valid project ID is required")),
});

export type CreateProjectBody = z.infer<typeof createProjectBodySchema>;
export type UpdateProjectBody = z.infer<typeof updateProjectBodySchema>;
export type ProjectIdParams = z.infer<typeof projectIdParamsSchema>;
