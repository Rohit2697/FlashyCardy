import { z } from "zod";

export const createDeckInputSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(255),
  description: z.string().trim().max(5000).nullable(),
});

export type CreateDeckInput = z.infer<typeof createDeckInputSchema>;
