import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { Show } from "@clerk/nextjs";
import { and, eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { buttonVariants } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { db } from "@/db";
import { cardsTable, decksTable } from "@/db/schema";
import { deleteDeckByIdForUser, getCardsByDeckIdForUser, getDeckByIdForUser } from "@/db/queries";
import {
  createCardInputSchema,
  deleteCardInputSchema,
  updateDeckInputSchema,
  updateCardInputSchema,
  deleteDeckInputSchema,
  type CreateCardInput,
  type DeleteCardInput,
  type UpdateDeckInput,
  type UpdateCardInput,
  type DeleteDeckInput,
} from "./schemas";
import { DeckCardsManager } from "./cards-manager";
import { DeckEditButton } from "./deck-edit-button";
import { DeckDeleteButton } from './deck-delete-button';
import { AIGenerateButton } from "./ai-generate-button";
import { generateCardsWithAIAction } from "./ai-actions";

function parseId(raw: string | null): number | null {
  const value = typeof raw === "string" ? raw : "";
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

async function requireUserId() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/");
  }
  return userId;
}

async function assertDeckOwnership(deckId: number, userId: string) {
  const deck = await getDeckByIdForUser(deckId, userId);
  if (!deck) {
    notFound();
  }
  return deck;
}

export default async function DeckDetailsPage({
  params,
}: {
  params: Promise<{ deckId: string }>;
}) {
  const userId = await requireUserId();
  const { deckId: deckIdParam } = await params;
  const deckId = parseId(deckIdParam);

  if (!deckId) {
    notFound();
  }

  const deck = await assertDeckOwnership(deckId, userId);
  const cards = await getCardsByDeckIdForUser(deck.id, userId);
  const dateFormatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const deckCreatedDate = dateFormatter.format(new Date(deck.updatedAt));

  async function createCardAction(input: CreateCardInput) {
    "use server";

    const parsed = createCardInputSchema.parse(input);
    const actionUserId = await requireUserId();
    await assertDeckOwnership(parsed.deckId, actionUserId);

    await db.insert(cardsTable).values({
      deckId: parsed.deckId,
      front: parsed.front,
      back: parsed.back,
    });

    await db
      .update(decksTable)
      .set({ updatedAt: new Date() })
      .where(and(eq(decksTable.id, parsed.deckId), eq(decksTable.userId, actionUserId)));

    revalidatePath(`/decks/${parsed.deckId}`);
    revalidatePath("/dashboard");
  }

  async function updateCardAction(input: UpdateCardInput) {
    "use server";

    const parsed = updateCardInputSchema.parse(input);
    const actionUserId = await requireUserId();
    await assertDeckOwnership(parsed.deckId, actionUserId);

    await db
      .update(cardsTable)
      .set({
        front: parsed.front,
        back: parsed.back,
        updatedAt: new Date(),
      })
      .where(and(eq(cardsTable.id, parsed.cardId), eq(cardsTable.deckId, parsed.deckId)));

    await db
      .update(decksTable)
      .set({ updatedAt: new Date() })
      .where(and(eq(decksTable.id, parsed.deckId), eq(decksTable.userId, actionUserId)));

    revalidatePath(`/decks/${parsed.deckId}`);
    revalidatePath("/dashboard");
  }

  async function deleteCardAction(input: DeleteCardInput) {
    "use server";

    const parsed = deleteCardInputSchema.parse(input);
    const actionUserId = await requireUserId();
    await assertDeckOwnership(parsed.deckId, actionUserId);

    await db
      .delete(cardsTable)
      .where(and(eq(cardsTable.id, parsed.cardId), eq(cardsTable.deckId, parsed.deckId)));

    await db
      .update(decksTable)
      .set({ updatedAt: new Date() })
      .where(and(eq(decksTable.id, parsed.deckId), eq(decksTable.userId, actionUserId)));

    revalidatePath(`/decks/${parsed.deckId}`);
    revalidatePath("/dashboard");
  }

  async function updateDeckAction(input: UpdateDeckInput) {
    "use server";

    const parsed = updateDeckInputSchema.parse(input);
    const actionUserId = await requireUserId();
    await assertDeckOwnership(parsed.deckId, actionUserId);

    await db
      .update(decksTable)
      .set({
        title: parsed.title,
        description: parsed.description,
        updatedAt: new Date(),
      })
      .where(and(eq(decksTable.id, parsed.deckId), eq(decksTable.userId, actionUserId)));

    revalidatePath(`/decks/${parsed.deckId}`);
    revalidatePath("/dashboard");
  }

  async function deleteDeckAction(input: DeleteDeckInput) {
    "use server";

    const parsed = deleteDeckInputSchema.parse(input);
    const actionUserId = await requireUserId();
    await assertDeckOwnership(parsed.deckId, actionUserId);

    await deleteDeckByIdForUser(parsed.deckId, actionUserId);

    revalidatePath("/dashboard");
  }

  return (
    <main className="flex min-h-screen w-full bg-background px-6 py-10">
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <Link
              href="/dashboard"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mb-2 inline-flex items-center gap-1.5")}
            >
              ← Back to dashboard
            </Link>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {deck.title}
            </h1>
            <p className="text-sm text-muted-foreground">
              {deck.description ?? "No description provided for this deck."}
            </p>
            <p className="text-xs text-muted-foreground">
              Created: {deckCreatedDate}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/decks/${deck.id}/study`}
              className={cn(buttonVariants({ variant: "default" }), "bg-green-600 hover:bg-green-700")}
            >
              Study Deck
            </Link>
            {/* AI Generate Button with Clerk feature gating */}
            <Show
              when={{ feature: "ai_deck_generation" }}
              fallback={
                <Tooltip
                  content={
                    <span>
                      Upgrade to Pro to generate cards with AI.{" "}
                      <Link href="/pricing" className="underline font-medium">
                        View plans
                      </Link>
                    </span>
                  }
                >
                  <Button
                    disabled
                    className="bg-gradient-to-r from-violet-600/50 to-indigo-600/50 text-white/60 cursor-not-allowed"
                  >
                    <svg
                      className="mr-1.5 h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                      <path d="M5 3v4" />
                      <path d="M19 17v4" />
                      <path d="M3 5h4" />
                      <path d="M17 19h4" />
                    </svg>
                    Generate Cards with AI
                  </Button>
                </Tooltip>
              }
            >
              {deck.description ? (
                <AIGenerateButton
                  deckId={deck.id}
                  generateCardsWithAIAction={generateCardsWithAIAction}
                />
              ) : (
                <Tooltip content="Add a description to this deck to generate cards with AI.">
                  <Button
                    disabled
                    className="bg-gradient-to-r from-violet-600/50 to-indigo-600/50 text-white/60 cursor-not-allowed"
                  >
                    <svg
                      className="mr-1.5 h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                      <path d="M5 3v4" />
                      <path d="M19 17v4" />
                      <path d="M3 5h4" />
                      <path d="M17 19h4" />
                    </svg>
                    Generate Cards with AI
                  </Button>
                </Tooltip>
              )}
            </Show>
            <DeckEditButton
              deckId={deck.id}
              initialTitle={deck.title}
              initialDescription={deck.description}
              updateDeckAction={updateDeckAction}
            />
            <DeckDeleteButton
              deckId={deck.id}
              deleteDeckAction={deleteDeckAction}
            />
            <div className="rounded-md border border-border bg-card px-3 py-1.5 text-sm text-muted-foreground">
              {cards.length} {cards.length === 1 ? "card" : "cards"}
            </div>
          </div>
        </header>

        <DeckCardsManager
          deckId={deck.id}
          cards={cards.map((card) => ({
            id: card.id,
            front: card.front,
            back: card.back,
            updatedAt: card.updatedAt.toISOString(),
          }))}
          createCardAction={createCardAction}
          updateCardAction={updateCardAction}
          deleteCardAction={deleteCardAction}
        />
      </section>
    </main>
  );
}
