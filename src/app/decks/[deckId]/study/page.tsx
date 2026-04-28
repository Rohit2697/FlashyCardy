import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getDeckByIdForUser, getCardsByDeckIdForUser } from "@/db/queries";
import { StudyClient } from "./study-client";

function parseId(raw: string | null): number | null {
  const value = typeof raw === "string" ? raw : "";
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

export default async function StudyPage({
  params,
}: {
  params: Promise<{ deckId: string }>;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/");
  }

  const { deckId: deckIdParam } = await params;
  const deckId = parseId(deckIdParam);

  if (!deckId) {
    notFound();
  }

  // Server-side data retrieval with ownership check
  const deck = await getDeckByIdForUser(deckId, userId);

  if (!deck) {
    notFound();
  }

  const cards = await getCardsByDeckIdForUser(deck.id, userId);

  if (cards.length === 0) {
    return (
      <main className="flex min-h-screen w-full flex-col items-center justify-center gap-4 bg-background px-6">
        <p className="text-lg text-muted-foreground">
          No cards in this deck to study.
        </p>
        <Link
          href={`/decks/${deckId}`}
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          Back to Deck
        </Link>
      </main>
    );
  }

  return (
    <StudyClient
      deckId={deck.id}
      cards={cards.map((card) => ({
        id: card.id,
        front: card.front,
        back: card.back,
      }))}
    />
  );
}