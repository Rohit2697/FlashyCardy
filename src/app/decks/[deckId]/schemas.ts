import { z } from "zod";

export const createCardInputSchema = z.object({
  deckId: z.number().int().positive(),
  front: z.string().trim().min(1).max(5000),
  back: z.string().trim().min(1).max(5000),
});

export const updateCardInputSchema = z.object({
  deckId: z.number().int().positive(),
  cardId: z.number().int().positive(),
  front: z.string().trim().min(1).max(5000),
  back: z.string().trim().min(1).max(5000),
});

export const deleteCardInputSchema = z.object({
  deckId: z.number().int().positive(),
  cardId: z.number().int().positive(),
});

export const updateDeckInputSchema = z.object({
  deckId: z.number().int().positive(),
  title: z.string().trim().min(1).max(255),
  description: z.string().trim().max(5000).nullable(),
});

export const deleteDeckInputSchema = z.object({
  deckId: z.number().int().positive(),
});

export type CreateCardInput = z.infer<typeof createCardInputSchema>;
export type UpdateCardInput = z.infer<typeof updateCardInputSchema>;
export type DeleteCardInput = z.infer<typeof deleteCardInputSchema>;
export type UpdateDeckInput = z.infer<typeof updateDeckInputSchema>;
export type DeleteDeckInput = z.infer<typeof deleteDeckInputSchema>;
