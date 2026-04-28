import { z } from "zod";

/**
 * Schema for a single AI-generated flashcard.
 */
export const aiGeneratedCardSchema = z.object({
  front: z
    .string()
    .min(1)
    .max(5000)
    .describe("The question or prompt shown on the front of the flashcard"),
  back: z
    .string()
    .min(1)
    .max(5000)
    .describe("The answer or explanation shown on the back of the flashcard"),
});

export type AIGeneratedCard = z.infer<typeof aiGeneratedCardSchema>;
