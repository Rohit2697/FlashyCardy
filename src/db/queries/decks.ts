import "server-only";
import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { cardsTable, decksTable } from "@/db/schema";

export async function getDecksWithCardCountByUserId(userId: string) {
  const decks = await db
    .select({
      id: decksTable.id,
      title: decksTable.title,
      description: decksTable.description,
      createdAt: decksTable.createdAt,
      updatedAt: decksTable.updatedAt,
    })
    .from(decksTable)
    .where(eq(decksTable.userId, userId))
    .orderBy(desc(decksTable.updatedAt));

  const deckIds = decks.map((deck) => deck.id);
  const cards = deckIds.length
    ? await db
        .select({ id: cardsTable.id })
        .from(cardsTable)
        .where(inArray(cardsTable.deckId, deckIds))
    : [];

  return {
    decks,
    cardCount: cards.length,
  };
}
