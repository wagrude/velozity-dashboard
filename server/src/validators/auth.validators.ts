import { z } from "zod";

export const loginBodySchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .pipe(z.email("A valid email is required")),
  password: z.string().min(1, "Password is required"),
});

export type LoginBody = z.infer<typeof loginBodySchema>;
