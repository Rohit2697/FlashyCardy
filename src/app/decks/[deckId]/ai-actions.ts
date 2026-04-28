"use server";

import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { generateText, Output } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { db } from "@/db";
import { cardsTable, decksTable } from "@/db/schema";
import { getDeckByIdForUser } from "@/db/queries";
import { aiGeneratedCardSchema } from "@/lib/ai/schemas";
import { revalidatePath } from "next/cache";

const generateCardsInputSchema = z.object({
  deckId: z.number().int().positive(),
});

export async function generateCardsWithAIAction(input: { deckId: number }) {
  const parsed = generateCardsInputSchema.parse(input);

  // --- Server-side auth + feature guard (Required) ---
  const { userId, has } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const canUseAI = has({ feature: "ai_deck_generation" });
  if (!canUseAI) {
    throw new Error("AI card generation requires a Pro subscription.");
  }

  // --- Deck ownership check ---
  const deck = await getDeckByIdForUser(parsed.deckId, userId);
  if (!deck) {
    throw new Error("Deck not found.");
  }

  // --- Server-side description validation (Required) ---
  if (!deck.description || deck.description.trim().length === 0) {
    throw new Error(
      "A deck description is required to generate cards with AI. Please add a description first."
    );
  }

  // --- Detect if this is a language-learning deck ---
  const combinedText = `${deck.title} ${deck.description}`.toLowerCase();
  const languagePatterns = [
    /\b(?:learn|learning|study|studying|practice|practicing)\b.*\b(?:language|vocabulary|vocab|words|phrases|sentences|translation|translations)\b/,
    /\b(?:from|to)\s+(?:english|spanish|french|german|italian|portuguese|chinese|japanese|korean|arabic|hindi|russian|indonesian|malay|thai|vietnamese|dutch|swedish|norwegian|danish|finnish|polish|turkish|greek|hebrew|czech|hungarian|romanian|ukrainian|bengali|tamil|telugu|urdu|persian|swahili|tagalog|filipino)\b/,
    /\b(?:english|spanish|french|german|italian|portuguese|chinese|japanese|korean|arabic|hindi|russian|indonesian|malay|thai|vietnamese|dutch|swedish|norwegian|danish|finnish|polish|turkish|greek|hebrew|czech|hungarian|romanian|ukrainian|bengali|tamil|telugu|urdu|persian|swahili|tagalog|filipino)\s+(?:to|from|-)\s+(?:english|spanish|french|german|italian|portuguese|chinese|japanese|korean|arabic|hindi|russian|indonesian|malay|thai|vietnamese|dutch|swedish|norwegian|danish|finnish|polish|turkish|greek|hebrew|czech|hungarian|romanian|ukrainian|bengali|tamil|telugu|urdu|persian|swahili|tagalog|filipino)\b/,
    /\b(?:vocabulary|vocab|translation|phrasebook|dictionary|bilingual)\b/,
  ];
  const isLanguageDeck = languagePatterns.some((pattern) => pattern.test(combinedText));

  // --- Build context-aware prompt ---
  let prompt: string;
  if (isLanguageDeck) {
    prompt = `You are a language learning flashcard generator.

Deck Title: ${deck.title}
Deck Description: ${deck.description}

Generate exactly 20 flashcards for this language learning deck.
Rules:
- The "front" of each card must be a word or sentence in the source language (the language the learner already knows).
- The "back" of each card must be the EXACT translation in the target language (the language being learned).
- Do NOT include any extra descriptions, explanations, pronunciation guides, or notes — only the direct translation.
- Mix common words, useful phrases, and practical sentences.
- Progress from simpler to slightly more complex content.`;
  } else {
    prompt = `You are a flashcard generator for educational study.

Deck Title: ${deck.title}
Deck Description: ${deck.description}

Generate exactly 20 flashcards for this deck.
Rules:
- Each card's "front" should be a clear question, term, or prompt relevant to the topic.
- Each card's "back" should be a concise, accurate answer or definition.
- Cover a broad range of key concepts within the topic.
- Make cards progressively more detailed.
- Be factually accurate and context-aware based on the deck title and description.`;
  }

  // --- Call AI with structured output using Output.array() ---
  const { output } = await generateText({
    model: openai("gpt-4o-mini"),
    output: Output.array({
      name: "Flashcards",
      description: "An array of flashcards generated from the deck topic.",
      element: aiGeneratedCardSchema,
    }),
    prompt,
  });

  if (!output || output.length === 0) {
    throw new Error("No cards were generated. Please try again.");
  }

  // --- Batch-insert all generated cards ---
  await db.insert(cardsTable).values(
    output.map((card) => ({
      deckId: parsed.deckId,
      front: card.front,
      back: card.back,
    }))
  );

  await db
    .update(decksTable)
    .set({ updatedAt: new Date() })
    .where(and(eq(decksTable.id, parsed.deckId), eq(decksTable.userId, userId)));

  revalidatePath(`/decks/${parsed.deckId}`);
  revalidatePath("/dashboard");

  return { count: output.length };
}
