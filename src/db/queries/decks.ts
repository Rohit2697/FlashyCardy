import "server-only";
import { and, desc, eq, inArray } from "drizzle-orm";
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

export async function getDeckByIdForUser(deckId: number, userId: string) {
  const [deck] = await db
    .select({
      id: decksTable.id,
      title: decksTable.title,
      description: decksTable.description,
      createdAt: decksTable.createdAt,
      updatedAt: decksTable.updatedAt,
    })
    .from(decksTable)
    .where(and(eq(decksTable.id, deckId), eq(decksTable.userId, userId)))
    .limit(1);

  return deck ?? null;
}

export async function getCardsByDeckIdForUser(
  deckId: number,
  userId: string,
) {
  return db
    .select({
      id: cardsTable.id,
      front: cardsTable.front,
      back: cardsTable.back,
      createdAt: cardsTable.createdAt,
      updatedAt: cardsTable.updatedAt,
    })
    .from(cardsTable)
    .innerJoin(decksTable, eq(cardsTable.deckId, decksTable.id))
    .where(and(eq(cardsTable.deckId, deckId), eq(decksTable.userId, userId)))
    .orderBy(desc(cardsTable.updatedAt), desc(cardsTable.id));
}

export async function createDeck(
  userId: string,
  title: string,
  description: string | null,
) {
  const [deck] = await db
    .insert(decksTable)
    .values({ userId, title, description })
    .returning({
      id: decksTable.id,
      title: decksTable.title,
      description: decksTable.description,
      createdAt: decksTable.createdAt,
      updatedAt: decksTable.updatedAt,
    });

  return deck;
}

export async function deleteDeckByIdForUser(
  deckId: number,
  userId: string,
) {
  // Delete all cards belonging to the deck first (cascade would handle this, but explicit is clearer)
  await db.delete(cardsTable).where(eq(cardsTable.deckId, deckId));

  // Delete the deck — scoped to the authenticated user
  await db
    .delete(decksTable)
    .where(and(eq(decksTable.id, deckId), eq(decksTable.userId, userId)));
}
