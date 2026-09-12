import { z } from "zod";

export const notificationIdParamsSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/, "A valid notification ID is required")
    .transform((value) => Number(value))
    .pipe(z.number().int().positive("A valid notification ID is required")),
});

export type NotificationIdParams = z.infer<typeof notificationIdParamsSchema>;
